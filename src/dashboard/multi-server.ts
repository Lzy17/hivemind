import fastify, { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import { join, resolve, normalize } from 'path';
import { readFile } from 'fs/promises';
import { SpecWatcher } from './watcher';
import { SpecParser, Task } from './parser';
import { ProjectDiscovery, DiscoveredProject } from './project-discovery';
import open from 'open';
import { WebSocket } from 'ws';
import { userInfo } from 'os';
import { isPortAvailable, findAvailablePort } from '../utils';
import { debug } from './logger';
import { TunnelManager, TunnelOptions, TunnelProviderError } from './tunnel';
import { CloudflareProvider } from './tunnel/cloudflare-provider-native';
import { NgrokProvider } from './tunnel/ngrok-provider-native';
import { GitHubIntegration } from '../collaboration/github-integration';
import { TeamManager } from '../auth/team-manager';
import { GitHubDashboard } from './github-dashboard';

interface ProjectState {
  project: DiscoveredProject;
  parser: SpecParser;
  watcher: SpecWatcher;
}

interface WebSocketConnection {
  socket: WebSocket;
}


// Discriminated union for type-safe active sessions
type ActiveSession = ActiveSpecSession | ActiveBugSession;

interface BaseActiveSession {
  projectPath: string;
  projectName: string;
  displayName: string;
  lastModified: Date;
  isCurrentlyActive: boolean;
  hasActiveSession: boolean;
  gitBranch?: string;
  gitCommit?: string;
}

interface ActiveSpecSession extends BaseActiveSession {
  type: 'spec';
  specName: string;
  task: Task;
  status?: string;
  requirements?: any;
  design?: any;
  tasks?: any;
  isAdHoc?: boolean;
}

interface ActiveBugSession extends BaseActiveSession {
  type: 'bug';
  bugName: string;
  bugStatus: 'reported' | 'analyzing' | 'fixing' | 'fixed' | 'verifying' | 'resolved';
  bugSeverity?: 'critical' | 'high' | 'medium' | 'low';
  nextCommand: string;  // e.g., '/bug-fix bug-name'
}

export interface MultiDashboardOptions {
  port: number;
  autoOpen?: boolean;
  tunnel?: boolean;
  tunnelPassword?: string;
  tunnelProvider?: string;
  githubToken?: string;
  githubOwner?: string;
  githubRepo?: string;
}

export class MultiProjectDashboardServer {
  private app: FastifyInstance;
  private options: MultiDashboardOptions;
  private clients: Set<WebSocket> = new Set();
  private projects: Map<string, ProjectState> = new Map();
  private discovery: ProjectDiscovery;
  private rescanInterval?: ReturnType<typeof setInterval>;
  private tunnelManager?: TunnelManager;
  private github?: GitHubIntegration;
  private teamManager?: TeamManager;
  private githubDashboard?: GitHubDashboard;

  constructor(options: MultiDashboardOptions) {
    this.options = options;
    this.discovery = new ProjectDiscovery();
    this.app = fastify({ logger: false });
    
    // Initialize GitHub integration if credentials provided
    if (options.githubToken && options.githubOwner && options.githubRepo) {
      this.github = new GitHubIntegration({
        token: options.githubToken,
        owner: options.githubOwner,
        repo: options.githubRepo,
      });
      this.teamManager = new TeamManager(this.github);
      this.githubDashboard = new GitHubDashboard(this.github, this.teamManager);
      console.log(`✅ GitHub integration enabled for ${options.githubOwner}/${options.githubRepo}`);
    }
  }

  async start() {
    // Discover projects
    console.log('Starting project discovery...');
    const discoveredProjects = await this.discovery.discoverProjects();

    // Projects are already filtered by discovery
    console.log(`Found ${discoveredProjects.length} projects:`);
    discoveredProjects.forEach(p => {
      console.log(`  - ${p.name} at ${p.path} (specs: ${p.specCount}, bugs: ${p.bugCount}, active: ${p.hasActiveSession})`);
    });

    // Initialize watchers for each project
    for (const project of discoveredProjects) {
      debug(`Initializing project ${project.name} at ${project.path}`);
      await this.initializeProject(project);
      debug(`Project ${project.name} initialized and added to projects Map`);
    }
    
    // Log all projects in the Map
    debug(`Total projects in Map: ${this.projects.size}`);
    this.projects.forEach((state, path) => {
      debug(`  - ${state.project.name}: ${path}`);
    });

    await this.app.register(fastifyWebsocket);

    // Register static file serving FIRST (before other routes)
    // In development, files are in src/dashboard, in production they're in dist/dashboard
    // We need to handle app.js specially since it might be in dist/dashboard even in dev mode
    await this.app.register(fastifyStatic, {
      root: __dirname, // Serve from the current directory (either src/dashboard or dist/dashboard)
      prefix: '/',
      decorateReply: true, // Enable sendFile method on reply
      wildcard: false // Disable wildcard to prevent catching all routes
    });

    // Special handling for app.js in development mode
    // Only add this route if app.js doesn't exist in the static file directory
    const { existsSync } = require('fs');
    const appJsPath = join(__dirname, 'app.js');
    if (!existsSync(appJsPath)) {
      this.app.get('/app.js', async (request, reply) => {
        const distAppJsPath = join(__dirname, '..', '..', 'dist', 'dashboard', 'app.js');
        
        // Try dist directory (development)
        if (existsSync(distAppJsPath)) {
          const { readFile } = require('fs/promises');
          const content = await readFile(distAppJsPath);
          reply.type('application/javascript');
          return reply.send(content);
        }
        // File not found
        else {
          return reply.code(404).send({ error: 'app.js not found - run npm run build:dashboard' });
        }
      });
    }

    // WebSocket endpoint
    const self = this;
    this.app.register(async function (fastify) {
      fastify.get('/ws', { websocket: true }, (connection: WebSocketConnection) => {
        const socket = connection.socket;
        debug('Multi-project WebSocket client connected');

        self.clients.add(socket);

        // Send initial state with all projects
        self.sendInitialState(socket);

        socket.on('close', () => {
          self.clients.delete(socket);
        });

        socket.on('error', (error: Error) => {
          console.error('WebSocket error:', error);
          self.clients.delete(socket);
        });
      });
    });

    // API endpoints
    this.app.get('/api/projects', async () => {
      const projectList = Array.from(this.projects.values()).map((p) => ({
        ...p.project,
        specs: [], // Don't include specs in list
      }));
      return projectList;
    });

    this.app.get('/api/projects/:projectPath/specs', async (request, reply) => {
      const { projectPath } = request.params as { projectPath: string };
      const decodedPath = normalize(resolve(decodeURIComponent(projectPath)));
      const projectState = this.projects.get(decodedPath);

      if (!projectState) {
        reply.code(404).send({ error: 'Project not found' });
        return;
      }

      const specs = await projectState.parser.getAllSpecs();
      return specs;
    });

    this.app.get('/api/projects/:projectPath/bugs', async (request, reply) => {
      const { projectPath } = request.params as { projectPath: string };
      const decodedPath = normalize(resolve(decodeURIComponent(projectPath)));
      const projectState = this.projects.get(decodedPath);

      if (!projectState) {
        reply.code(404).send({ error: 'Project not found' });
        return;
      }

      const bugs = await projectState.parser.getAllBugs();
      return bugs;
    });

    // Get raw markdown content for a specific document
    this.app.get('/api/projects/:projectPath/specs/:name/:document', async (request, reply) => {
      const { projectPath, name, document } = request.params as { projectPath: string; name: string; document: string };
      const decodedPath = normalize(resolve(decodeURIComponent(projectPath)));
      const projectState = this.projects.get(decodedPath);

      if (!projectState) {
        reply.code(404).send({ error: 'Project not found' });
        return;
      }

      const allowedDocs = ['requirements', 'design', 'tasks'];
      if (!allowedDocs.includes(document)) {
        reply.code(400).send({ error: 'Invalid document type' });
        return;
      }

      const docPath = join(decodedPath, '.claude', 'specs', name, `${document}.md`);
      
      try {
        const content = await readFile(docPath, 'utf-8');
        return { content };
      } catch {
        reply.code(404).send({ error: 'Document not found' });
      }
    });

    // Get raw markdown content for bug documents
    this.app.get('/api/projects/:projectPath/bugs/:name/:document', async (request, reply) => {
      const { projectPath, name, document } = request.params as { projectPath: string; name: string; document: string };
      const decodedPath = normalize(resolve(decodeURIComponent(projectPath)));
      const projectState = this.projects.get(decodedPath);

      if (!projectState) {
        reply.code(404).send({ error: 'Project not found' });
        return;
      }

      const allowedDocs = ['report', 'analysis', 'fix', 'verification'];
      if (!allowedDocs.includes(document)) {
        reply.code(400).send({ error: 'Invalid document type' });
        return;
      }

      const docPath = join(decodedPath, '.claude', 'bugs', name, `${document}.md`);
      
      try {
        const content = await readFile(docPath, 'utf-8');
        return { content };
      } catch {
        reply.code(404).send({ error: 'Document not found' });
      }
    });

    // GitHub API endpoints
    if (this.github && this.githubDashboard && this.teamManager) {
      this.app.get('/api/github/issues', async () => {
        return await this.github!.getOpenIssues();
      });

      this.app.get('/api/github/prs', async () => {
        return await this.github!.getPendingPRs();
      });

      this.app.get('/api/github/kanban', async () => {
        return await this.githubDashboard!.renderPRKanban([]);
      });

      this.app.get('/api/github/team/:teamId/metrics', async (request) => {
        const { teamId } = request.params as { teamId: string };
        return await this.githubDashboard!.getTeamMetrics(teamId);
      });

      this.app.get('/api/github/team/:teamId/velocity', async (request) => {
        const { teamId } = request.params as { teamId: string };
        return await this.githubDashboard!.renderVelocityChart(teamId);
      });

      this.app.get('/api/github/trends', async () => {
        return await this.githubDashboard!.renderCodeQualityTrends();
      });

      this.app.post('/api/github/issues/:issueNumber/assign', async (request, reply) => {
        const { issueNumber } = request.params as { issueNumber: string };
        const { assignee } = request.body as { assignee: string };
        
        try {
          const issues = await this.github!.getOpenIssues();
          const issue = issues.find(i => i.number === parseInt(issueNumber));
          
          if (!issue) {
            reply.code(404).send({ error: 'Issue not found' });
            return;
          }

          await this.github!.autoAssignIssue(issue, [{ username: assignee, skills: [], workload: 0 }]);
          return { success: true, issue: issue.number, assignee };
        } catch (error) {
          reply.code(500).send({ error: 'Failed to assign issue', details: error });
        }
      });

      this.app.post('/api/github/teams', async (request, reply) => {
        const { name, githubOrg } = request.body as { name: string; githubOrg: string };
        
        try {
          const team = await this.teamManager!.createTeam(name, githubOrg);
          return { success: true, team };
        } catch (error) {
          reply.code(500).send({ error: 'Failed to create team', details: error });
        }
      });

      this.app.get('/api/github/teams', async () => {
        return this.teamManager!.getAllTeams();
      });

      // GitHub webhooks endpoint
      this.app.post('/api/github/webhooks', async (request, reply) => {
        const event = request.headers['x-github-event'] as string;
        const payload = request.body as any;
        
        try {
          await this.handleGitHubWebhook(event, payload);
          return { success: true };
        } catch (error) {
          console.error('GitHub webhook error:', error);
          reply.code(500).send({ error: 'Webhook processing failed' });
        }
      });
    }

    // Tunnel API endpoints
    this.app.get('/api/tunnel/status', async () => {
      const status = this.getTunnelStatus();
      return status;
    });

    this.app.post('/api/tunnel/start', async (request, reply) => {
      try {
        // Always ensure tunnel manager is initialized
        if (!this.tunnelManager) {
          this.tunnelManager = new TunnelManager(this.app);
          this.tunnelManager.registerProvider(new CloudflareProvider());
          this.tunnelManager.registerProvider(new NgrokProvider());
          
          // Listen for tunnel events
          this.tunnelManager.on('tunnel:started', (tunnelInfo) => {
            console.log(`✅ Tunnel started: ${tunnelInfo.url} (${tunnelInfo.provider})`);
            debug('Tunnel started event:', tunnelInfo);
            this.broadcast({
              type: 'tunnel:started',
              data: tunnelInfo
            });
          });
          
          this.tunnelManager.on('tunnel:stopped', (data) => {
            console.log('🛑 Tunnel stopped');
            debug('Tunnel stopped event:', data);
            this.broadcast({
              type: 'tunnel:stopped',
              data: data || {}
            });
          });
          
          this.tunnelManager.on('tunnel:metrics:updated', (metrics) => {
            debug('Tunnel metrics updated:', metrics);
            this.broadcast({
              type: 'tunnel:metrics:updated',
              data: metrics
            });
          });
          
          this.tunnelManager.on('tunnel:visitor:new', (visitor) => {
            console.log(`👤 New tunnel visitor from ${visitor.country || 'Unknown'}`);
            debug('New tunnel visitor:', visitor);
          });
          
          this.tunnelManager.on('tunnel:recovery:start', (data) => {
            console.log(`🔄 Tunnel recovery started (attempt ${data.attempt})`);
          });
          
          this.tunnelManager.on('tunnel:recovery:success', () => {
            console.log('✅ Tunnel recovery successful');
          });
          
          this.tunnelManager.on('tunnel:recovery:failed', (data) => {
            console.log(`❌ Tunnel recovery failed: ${data.error}`);
          });
        }
        
        // Check if tunnel is already active
        const status = this.getTunnelStatus();
        if (status.active) {
          return { success: true, message: 'Tunnel already active', tunnelInfo: status.info };
        }
        
        // Start tunnel with options from command line
        const tunnelOptions: TunnelOptions = {
          provider: this.options.tunnelProvider,
          password: this.options.tunnelPassword,
          analytics: true
        };
        
        console.log(`🚀 Starting tunnel (provider: ${tunnelOptions.provider || 'auto'})...`);
        debug(`Starting tunnel with provider: ${tunnelOptions.provider || 'auto'}`);
        const tunnelInfo = await this.tunnelManager.startTunnel(tunnelOptions);
        debug('Tunnel started via API:', tunnelInfo);
        
        return { success: true, tunnelInfo };
      } catch (error) {
        console.error('Error starting tunnel:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        reply.code(500).send({ error: 'Failed to start tunnel', details: errorMessage });
      }
    });

    this.app.post('/api/tunnel/stop', async (request, reply) => {
      if (!this.tunnelManager) {
        reply.code(404).send({ error: 'No tunnel manager available' });
        return;
      }
      
      try {
        await this.tunnelManager.stopTunnel();
        
        // Broadcast tunnel stopped event
        this.broadcast({
          type: 'tunnel:stopped',
          data: {}
        });
        
        return { success: true };
      } catch (error) {
        console.error('Error stopping tunnel:', error);
        reply.code(500).send({ error: 'Failed to stop tunnel' });
      }
    });

    // SPA fallback - serve index.html for any non-API, non-static route
    // This must come AFTER all API routes but will work with the static plugin
    this.app.setNotFoundHandler((request, reply) => {
      // Only handle GET requests that aren't API or WebSocket
      if (request.method === 'GET' && 
          !request.url.startsWith('/api/') && 
          !request.url.startsWith('/ws')) {
        // Serve the index.html file for SPA routing
        reply.sendFile('index.html');
      } else {
        reply.code(404).send({ error: 'Not found' });
      }
    });

    // Find available port if the requested port is busy
    let actualPort = this.options.port;
    if (!(await isPortAvailable(this.options.port))) {
      console.log(`Port ${this.options.port} is in use, finding alternative...`);
      actualPort = await findAvailablePort(this.options.port);
      console.log(`Using port ${actualPort} instead`);
    }

    // Start server
    await this.app.listen({ port: actualPort, host: '0.0.0.0' });
    
    // Update the port in options for URL generation
    this.options.port = actualPort;

    // Initialize tunnel if requested
    if (this.options.tunnel) {
      await this.initializeTunnel();
    }

    // Start periodic rescan for new active projects and cleanup removed ones
    // This complements file watching by detecting removed projects
    this.startPeriodicRescan();

    // Open browser if requested (always use localhost for local user)
    if (this.options.autoOpen) {
      await open(`http://localhost:${this.options.port}`);
    }
  }

  private async initializeProject(project: DiscoveredProject) {
    // Normalize and resolve the project path to handle different path formats
    const normalizedPath = normalize(resolve(project.path));
    project.path = normalizedPath; // Update the project path with normalized version
    
    const parser = new SpecParser(normalizedPath);
    const watcher = new SpecWatcher(normalizedPath, parser);

    // Set up watcher events
    watcher.on('change', async (event) => {
      debug(`[Multi-server] Watcher change event received for project ${project.name}:`, event);
      // Transform the watcher event into the format expected by the client
      const projectUpdateEvent = {
        type: 'spec-update',
        spec: event.spec,
        file: event.file,
        data: event.data,
      };
      
      // Broadcast update with project context
      const message = JSON.stringify({
        type: 'project-update',
        projectPath: project.path,
        data: projectUpdateEvent,
      });

      debug(`[Multi-server] Sending spec update for ${project.name}/${event.spec} to ${this.clients.size} clients`);
      let sentCount = 0;
      this.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(message);
          sentCount++;
          debug(`[Multi-server] Sent update to client ${sentCount}`);
        } else {
          debug(`[Multi-server] Client has readyState ${client.readyState}, skipping`);
        }
      });
      if (sentCount === 0) {
        debug(`[Multi-server] WARNING: No clients received the update!`);
      }

      // Also send updated active sessions
      const activeSessions = await this.collectActiveSessions();
      debug(`[Multi-server] Collected ${activeSessions.length} active sessions after spec update`);
      const activeSessionsMessage = JSON.stringify({
        type: 'active-sessions-update',
        data: activeSessions,
      });

      this.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(activeSessionsMessage);
        }
      });
    });

    // Handle git change events
    watcher.on('git-change', async (event) => {
      debug(`[Multi-server] Git change detected for ${project.name}:`, event);
      
      // Update the project's git info
      if (event.branch) {
        project.gitBranch = event.branch;
      }
      if (event.commit) {
        project.gitCommit = event.commit;
      }

      // Send git update to all clients
      const message = JSON.stringify({
        type: 'git-update',
        projectPath: project.path,
        gitBranch: project.gitBranch,
        gitCommit: project.gitCommit,
      });

      this.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(message);
        }
      });
    });

    // Handle steering change events
    watcher.on('steering-change', async (event) => {
      debug(`[Multi-server] Steering change detected for ${project.name}:`, event);
      
      // Send steering update to all clients
      const message = JSON.stringify({
        type: 'steering-update',
        projectPath: project.path,
        data: event.steeringStatus,
      });

      this.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(message);
        }
      });
    });

    // Handle bug change events
    watcher.on('bug-change', async (event) => {
      debug(`[Multi-server] Bug change detected for ${project.name}:`, event);
      
      // Send bug update to all clients
      const message = JSON.stringify({
        type: 'bug-update',
        projectPath: project.path,
        data: event,
      });

      this.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(message);
        }
      });
    });

    debug(`[Multi-server] Starting watcher for project ${project.name} at path: ${project.path}`);
    await watcher.start();
    debug(`[Multi-server] Watcher started successfully for ${project.name}`);

    this.projects.set(project.path, {
      project,
      parser,
      watcher,
    });
  }

  private async sendInitialState(socket: WebSocket) {
    const projects = await Promise.all(
      Array.from(this.projects.entries()).map(async ([path, state]) => {
        const specs = await state.parser.getAllSpecs();
        const bugs = await state.parser.getAllBugs();
        const steeringStatus = await state.parser.getProjectSteeringStatus();
        const projectData = {
          ...state.project,
          specs,
          bugs,
          steering: steeringStatus,
        };
        debug(`Sending project ${projectData.name} (${path}) with ${specs.length} specs, ${bugs.length} bugs`);
        return projectData;
      })
    );

    // Collect all active sessions across projects
    const activeSessions = await this.collectActiveSessions();

    debug(`Sending initial state: ${projects.length} projects, ${activeSessions.length} active sessions`);
    projects.forEach(p => {
      debug(`  Project: ${p.name} (${p.path}) - specs: ${p.specs?.length || 0}, bugs: ${p.bugs?.length || 0}`);
    });

    socket.send(
      JSON.stringify({
        type: 'initial',
        data: projects,
        activeSessions,
        username: this.getUsername(),
      })
    );
  }

  private async collectActiveSessions(): Promise<ActiveSession[]> {
    const allActiveSessions: ActiveSession[] = [];

    for (const [projectPath, state] of this.projects) {
      // Only include projects where a Claude process is actually running
      if (!state.project.hasActiveSession) {
        debug(`[collectActiveSessions] Project ${state.project.name}: no active Claude process, skipping`);
        continue;
      }

      debug(`[collectActiveSessions] Project ${state.project.name}: has active Claude process, finding active work item`);
      
      const specs = await state.parser.getAllSpecs();
      const bugs = await state.parser.getAllBugs();
      const activeWorkItems: Array<{
        type: 'spec' | 'bug';
        item: any;
        lastModified: Date;
        priority: number; // Higher priority = more active
      }> = [];

      // Collect specs with active tasks (highest priority)
      for (const spec of specs) {
        if (spec.tasks && spec.tasks.inProgress) {
          activeWorkItems.push({
            type: 'spec',
            item: spec,
            lastModified: spec.lastModified || new Date(0),
            priority: 100 // Highest priority - active task
          });
        }
      }

      // Collect active bugs (high priority)
      for (const bug of bugs) {
        if (['analyzing', 'fixing', 'verifying'].includes(bug.status)) {
          activeWorkItems.push({
            type: 'bug',
            item: bug,
            lastModified: bug.lastModified || new Date(0),
            priority: 90 // High priority - active bug
          });
        }
      }

      // If no active work, collect recent incomplete work as fallback (lower priority)
      if (activeWorkItems.length === 0) {
        // Add most recently modified specs that are not completed
        for (const spec of specs) {
          if (spec.status !== 'completed') {
            activeWorkItems.push({
              type: 'spec',
              item: spec,
              lastModified: spec.lastModified || new Date(0),
              priority: 10 // Low priority - incomplete work
            });
          }
        }

        // Add most recently modified bugs that are not resolved
        for (const bug of bugs) {
          if (bug.status !== 'resolved') {
            activeWorkItems.push({
              type: 'bug',
              item: bug,
              lastModified: bug.lastModified || new Date(0),
              priority: 10 // Low priority - incomplete work
            });
          }
        }
      }

      // Sort by priority first, then by lastModified descending
      activeWorkItems.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }
        return b.lastModified.getTime() - a.lastModified.getTime(); // Most recent first
      });

      let activeSession: ActiveSession | null = null;

      if (activeWorkItems.length > 0) {
        const mostRecent = activeWorkItems[0];
        
        if (mostRecent.type === 'spec') {
          const spec = mostRecent.item;
          // For specs, try to find an active task, otherwise use a placeholder
          let activeTask = null;
          if (spec.tasks && spec.tasks.inProgress) {
            activeTask = this.findTaskById(spec.tasks.taskList, spec.tasks.inProgress);
          }
          
          // If no active task, create a placeholder representing the spec
          if (!activeTask) {
            activeTask = {
              id: 'session',
              description: `${spec.displayName || spec.name}`,
              completed: false,
              requirements: []
            };
          }

          activeSession = {
            type: 'spec',
            projectPath,
            projectName: state.project.name,
            displayName: spec.displayName || spec.name,
            specName: spec.name,
            status: spec.status, // Include spec status
            requirements: spec.requirements,
            design: spec.design,
            tasks: spec.tasks,
            task: activeTask,
            lastModified: mostRecent.lastModified,
            isCurrentlyActive: true,
            hasActiveSession: true,
            gitBranch: state.project.gitBranch,
            gitCommit: state.project.gitCommit,
          } as ActiveSpecSession;

        } else if (mostRecent.type === 'bug') {
          const bug = mostRecent.item;
          
          // Determine the next command based on bug status
          let nextCommand = '';
          switch (bug.status) {
            case 'reported':
              nextCommand = `/bug-analyze ${bug.name}`;
              break;
            case 'analyzing':
              nextCommand = `/bug-analyze ${bug.name}`;
              break;
            case 'fixing':
              nextCommand = `/bug-fix ${bug.name}`;
              break;
            case 'verifying':
              nextCommand = `/bug-verify ${bug.name}`;
              break;
            case 'fixed':
              nextCommand = `/bug-verify ${bug.name}`;
              break;
            case 'resolved':
              nextCommand = ''; // Bug is complete, no next command
              break;
            default:
              nextCommand = `/bug-analyze ${bug.name}`;
          }

          activeSession = {
            type: 'bug',
            projectPath,
            projectName: state.project.name,
            displayName: bug.displayName || bug.name,
            bugName: bug.name,
            bugStatus: bug.status, // Use the actual bug status, including 'fixed' and 'resolved'
            bugSeverity: bug.report?.severity,
            nextCommand,
            lastModified: mostRecent.lastModified,
            isCurrentlyActive: true,
            hasActiveSession: true,
            gitBranch: state.project.gitBranch,
            gitCommit: state.project.gitCommit,
          } as ActiveBugSession;
        }
      } else {
        // No work items found, create a generic session for the active Claude process
        activeSession = {
          type: 'spec',
          projectPath,
          projectName: state.project.name,
          displayName: 'Ad-hoc Session',
          specName: 'ad-hoc-session',
          isAdHoc: true, // Mark as ad-hoc
          task: {
            id: 'session',
            description: 'Active Claude session',
            completed: false,
            requirements: []
          },
          lastModified: new Date(),
          isCurrentlyActive: true,
          hasActiveSession: true,
          gitBranch: state.project.gitBranch,
          gitCommit: state.project.gitCommit,
        } as ActiveSpecSession;
      }

      if (activeSession) {
        debug(`[collectActiveSessions] Project ${state.project.name}: selected ${activeSession.type} session (${activeSession.type === 'spec' ? activeSession.specName : activeSession.bugName})`);
        allActiveSessions.push(activeSession);
      }
    }

    // Sort by currently active first, then by project name
    allActiveSessions.sort((a, b) => {
      if (a.isCurrentlyActive && !b.isCurrentlyActive) return -1;
      if (!a.isCurrentlyActive && b.isCurrentlyActive) return 1;
      return a.projectName.localeCompare(b.projectName);
    });

    debug(`[collectActiveSessions] Total active sessions found: ${allActiveSessions.length} (filtered to single session per project)`);
    return allActiveSessions;
  }

  private findTaskById(tasks: Task[], taskId: string): Task | null {
    for (const task of tasks) {
      if (task.id === taskId) {
        return task;
      }

      if (task.subtasks) {
        const found = this.findTaskById(task.subtasks, taskId);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  private startPeriodicRescan() {
    // Rescan every 10 seconds for new/removed projects
    this.rescanInterval = setInterval(async () => {
      const activeProjects = await this.discovery.discoverProjects();

      // Check for new projects
      for (const project of activeProjects) {
        if (!this.projects.has(project.path)) {
          debug(`New active project detected: ${project.name}`);
          await this.initializeProject(project);

          // Notify all clients about the new project
          const parser = this.projects.get(project.path)?.parser;
          const specs = (await parser?.getAllSpecs()) || [];
          const bugs = (await parser?.getAllBugs()) || [];
          const steeringStatus = await parser?.getProjectSteeringStatus();
          const projectData = { ...project, specs, bugs, steering: steeringStatus };

          const message = JSON.stringify({
            type: 'new-project',
            data: projectData,
          });

          this.clients.forEach((client) => {
            if (client.readyState === 1) {
              client.send(message);
            }
          });
        }
      }

      // Check for projects that should be removed
      // A project should be removed if:
      // 1. It's not in the discovered projects list (no .claude directory or no specs/bugs)
      // 2. It has no active Claude session
      for (const [path, state] of this.projects) {
        const stillExists = activeProjects.some((p) => p.path === path);
        
        if (!stillExists) {
          debug(`Project no longer exists or has no content: ${state.project.name}`);
          
          // Stop the watcher for this project
          await state.watcher.stop();
          this.projects.delete(path);

          // Notify clients to remove the project
          const message = JSON.stringify({
            type: 'remove-project',
            data: { path },
          });

          this.clients.forEach((client) => {
            if (client.readyState === 1) {
              client.send(message);
            }
          });
          
          debug(`Removed project: ${state.project.name} from dashboard`);
        }
      }

      // Also send updated active sessions periodically
      const activeSessions = await this.collectActiveSessions();
      const activeSessionsMessage = JSON.stringify({
        type: 'active-sessions-update',
        data: activeSessions,
      });

      this.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(activeSessionsMessage);
        }
      });
    }, 10000); // 10 seconds for more responsive updates
  }

  async stop() {
    // Stop the rescan interval
    if (this.rescanInterval) {
      clearInterval(this.rescanInterval);
    }

    // Stop all watchers
    for (const [, state] of this.projects) {
      await state.watcher.stop();
    }

    // Stop the tunnel if active
    if (this.tunnelManager) {
      await this.tunnelManager.stopTunnel();
    }

    // Close all WebSocket connections
    this.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.close();
      }
    });
    this.clients.clear();

    // Close the server
    await this.app.close();
  }

  private async initializeTunnel() {
    // Initialize tunnel manager
    this.tunnelManager = new TunnelManager(this.app);
    
    // Register providers
    this.tunnelManager.registerProvider(new CloudflareProvider());
    this.tunnelManager.registerProvider(new NgrokProvider());
    
    // Listen for tunnel events
    this.tunnelManager.on('tunnel:started', (tunnelInfo) => {
      console.log(`✅ Tunnel started: ${tunnelInfo.url} (${tunnelInfo.provider})`);
      debug('Tunnel started event:', tunnelInfo);
      this.broadcast({
        type: 'tunnel:started',
        data: tunnelInfo
      });
    });
    
    this.tunnelManager.on('tunnel:stopped', (data) => {
      console.log('🛑 Tunnel stopped');
      debug('Tunnel stopped event:', data);
      this.broadcast({
        type: 'tunnel:stopped',
        data: data || {}
      });
    });
    
    this.tunnelManager.on('tunnel:metrics:updated', (metrics) => {
      debug('Tunnel metrics updated:', metrics);
      this.broadcast({
        type: 'tunnel:metrics:updated',
        data: metrics
      });
    });
    
    this.tunnelManager.on('tunnel:visitor:new', (visitor) => {
      console.log(`👤 New tunnel visitor from ${visitor.country || 'Unknown'}`);
      debug('New tunnel visitor:', visitor);
    });
    
    this.tunnelManager.on('tunnel:recovery:start', (data) => {
      console.log(`🔄 Tunnel recovery started (attempt ${data.attempt})`);
    });
    
    this.tunnelManager.on('tunnel:recovery:success', () => {
      console.log('✅ Tunnel recovery successful');
    });
    
    this.tunnelManager.on('tunnel:recovery:failed', (data) => {
      console.log(`❌ Tunnel recovery failed: ${data.error}`);
    });
    
    // Start tunnel with options
    const tunnelOptions: TunnelOptions = {
      provider: this.options.tunnelProvider,
      password: this.options.tunnelPassword,
      analytics: true
    };
    
    try {
      console.log(`🚀 Starting tunnel (provider: ${tunnelOptions.provider || 'auto'})...`);
      const tunnelInfo = await this.tunnelManager.startTunnel(tunnelOptions);
      debug('Tunnel created:', tunnelInfo);
    } catch (error) {
      if (error instanceof TunnelProviderError) {
        console.error('Tunnel setup failed:', error.getUserFriendlyMessage());
      } else {
        console.error('Failed to create tunnel:', error);
      }
      throw error;
    }
  }

  getTunnelStatus() {
    return this.tunnelManager?.getStatus() || { active: false };
  }

  private async handleGitHubWebhook(event: string, payload: any): Promise<void> {
    debug(`GitHub webhook received: ${event}`);
    
    switch (event) {
      case 'push':
        await this.handlePushEvent(payload);
        break;
      case 'pull_request':
        await this.handlePREvent(payload);
        break;
      case 'issues':
        await this.handleIssueEvent(payload);
        break;
      case 'pull_request_review':
        await this.handleReviewEvent(payload);
        break;
      default:
        debug(`Unhandled GitHub event: ${event}`);
    }
  }

  private async handlePushEvent(payload: any): Promise<void> {
    const { repository, ref, commits } = payload;
    const branch = ref.replace('refs/heads/', '');
    
    debug(`Push to ${repository.full_name}:${branch} - ${commits.length} commits`);
    
    // Broadcast push event to connected clients
    this.broadcast({
      type: 'github:push',
      data: {
        repository: repository.full_name,
        branch,
        commits: commits.length,
        author: commits[0]?.author?.name,
      },
    });
  }

  private async handlePREvent(payload: any): Promise<void> {
    const { action, pull_request } = payload;
    
    debug(`PR ${action}: #${pull_request.number} - ${pull_request.title}`);
    
    // Broadcast PR event to connected clients
    this.broadcast({
      type: 'github:pr',
      data: {
        action,
        number: pull_request.number,
        title: pull_request.title,
        author: pull_request.user.login,
        url: pull_request.html_url,
      },
    });
  }

  private async handleIssueEvent(payload: any): Promise<void> {
    const { action, issue } = payload;
    
    debug(`Issue ${action}: #${issue.number} - ${issue.title}`);
    
    // Broadcast issue event to connected clients
    this.broadcast({
      type: 'github:issue',
      data: {
        action,
        number: issue.number,
        title: issue.title,
        assignee: issue.assignee?.login,
        url: issue.html_url,
      },
    });
  }

  private async handleReviewEvent(payload: any): Promise<void> {
    const { action, review, pull_request } = payload;
    
    debug(`Review ${action} on PR #${pull_request.number} by ${review.user.login}`);
    
    // Broadcast review event to connected clients
    this.broadcast({
      type: 'github:review',
      data: {
        action,
        prNumber: pull_request.number,
        reviewer: review.user.login,
        state: review.state,
      },
    });
  }

  private broadcast(message: { type: string; data: unknown }) {
    const jsonMessage = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === 1) {
        // WebSocket.OPEN
        client.send(jsonMessage);
      }
    });
  }

  private getUsername(): string {
    try {
      const info = userInfo();
      // Try to get the full name first, fall back to username
      const username = info.username || 'User';
      // Capitalize first letter
      return username.charAt(0).toUpperCase() + username.slice(1);
    } catch {
      return 'User';
    }
  }
}
