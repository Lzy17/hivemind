import { Octokit } from '@octokit/rest';
import { ParsedTask } from '../task-generator';

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

export interface Issue {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  assignee?: string;
  labels: string[];
  html_url: string;
}

export interface PullRequest {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  head: { ref: string };
  base: { ref: string };
  html_url: string;
}

export interface Branch {
  name: string;
  sha: string;
}

export interface SpecDocument {
  name: string;
  requirements?: any;
  design?: any;
  tasks?: ParsedTask[];
}

export interface TeamMember {
  username: string;
  skills: string[];
  workload: number;
}

export class GitHubIntegration {
  private octokit: Octokit;
  private config: GitHubConfig;

  constructor(config: GitHubConfig) {
    this.config = config;
    this.octokit = new Octokit({
      auth: config.token,
    });
  }

  async createIssue(title: string, body: string, labels?: string[], assignee?: string): Promise<Issue> {
    const response = await this.octokit.rest.issues.create({
      owner: this.config.owner,
      repo: this.config.repo,
      title,
      body,
      labels,
      assignee,
    });

    return {
      number: response.data.number,
      title: response.data.title,
      body: response.data.body || '',
      state: response.data.state as 'open' | 'closed',
      assignee: response.data.assignee?.login,
      labels: response.data.labels.map(label => typeof label === 'string' ? label : label.name || ''),
      html_url: response.data.html_url,
    };
  }

  async createBranch(branchName: string, baseBranch: string = 'main'): Promise<Branch> {
    const baseRef = await this.octokit.rest.git.getRef({
      owner: this.config.owner,
      repo: this.config.repo,
      ref: `heads/${baseBranch}`,
    });

    const response = await this.octokit.rest.git.createRef({
      owner: this.config.owner,
      repo: this.config.repo,
      ref: `refs/heads/${branchName}`,
      sha: baseRef.data.object.sha,
    });

    return {
      name: branchName,
      sha: response.data.object.sha,
    };
  }

  async createPR(head: string, base: string, title: string, body: string): Promise<PullRequest> {
    const response = await this.octokit.rest.pulls.create({
      owner: this.config.owner,
      repo: this.config.repo,
      title,
      body,
      head,
      base,
    });

    return {
      number: response.data.number,
      title: response.data.title,
      body: response.data.body || '',
      state: response.data.state as 'open' | 'closed',
      head: { ref: response.data.head.ref },
      base: { ref: response.data.base.ref },
      html_url: response.data.html_url,
    };
  }

  async convertSpecToIssues(spec: SpecDocument): Promise<Issue[]> {
    const issues: Issue[] = [];

    // Create main epic issue
    const epicTitle = `[EPIC] ${spec.name}`;
    const epicBody = this.buildEpicBody(spec);
    
    const epicIssue = await this.createIssue(
      epicTitle,
      epicBody,
      ['epic', 'spec'],
    );
    issues.push(epicIssue);

    // Create individual task issues
    if (spec.tasks) {
      for (const task of spec.tasks) {
        const taskTitle = `[${spec.name}] Task ${task.id}: ${task.description}`;
        const taskBody = this.buildTaskBody(task, spec.name, epicIssue.number);
        
        const taskIssue = await this.createIssue(
          taskTitle,
          taskBody,
          ['task', 'spec', spec.name],
        );
        issues.push(taskIssue);
      }
    }

    return issues;
  }

  async autoAssignIssue(issue: Issue, teamMembers: TeamMember[]): Promise<void> {
    if (teamMembers.length === 0) return;

    // Simple assignment strategy: assign to member with lowest workload
    const availableMember = teamMembers
      .sort((a, b) => a.workload - b.workload)[0];

    await this.octokit.rest.issues.addAssignees({
      owner: this.config.owner,
      repo: this.config.repo,
      issue_number: issue.number,
      assignees: [availableMember.username],
    });
  }

  async triggerPRCreation(branchName: string, targetBranch: string = 'main'): Promise<PullRequest> {
    const title = this.generatePRTitle(branchName);
    const body = this.generatePRBody(branchName);

    return this.createPR(branchName, targetBranch, title, body);
  }

  async getOpenIssues(): Promise<Issue[]> {
    const response = await this.octokit.rest.issues.listForRepo({
      owner: this.config.owner,
      repo: this.config.repo,
      state: 'open',
    });

    return response.data.map(issue => ({
      number: issue.number,
      title: issue.title,
      body: issue.body || '',
      state: issue.state as 'open' | 'closed',
      assignee: issue.assignee?.login,
      labels: issue.labels.map(label => typeof label === 'string' ? label : label.name || ''),
      html_url: issue.html_url,
    }));
  }

  async getPendingPRs(): Promise<PullRequest[]> {
    const response = await this.octokit.rest.pulls.list({
      owner: this.config.owner,
      repo: this.config.repo,
      state: 'open',
    });

    return response.data.map(pr => ({
      number: pr.number,
      title: pr.title,
      body: pr.body || '',
      state: pr.state as 'open' | 'closed',
      head: { ref: pr.head.ref },
      base: { ref: pr.base.ref },
      html_url: pr.html_url,
    }));
  }

  private buildEpicBody(spec: SpecDocument): string {
    let body = `## Epic: ${spec.name}\n\n`;
    
    if (spec.requirements) {
      body += `### Requirements Summary\n${this.extractRequirementsSummary(spec.requirements)}\n\n`;
    }
    
    if (spec.design) {
      body += `### Design Overview\n${this.extractDesignSummary(spec.design)}\n\n`;
    }
    
    if (spec.tasks && spec.tasks.length > 0) {
      body += `### Tasks\n`;
      spec.tasks.forEach(task => {
        body += `- [ ] Task ${task.id}: ${task.description}\n`;
      });
      body += '\n';
    }
    
    body += `---\n`;
    body += `🤖 Generated with [Claude Code Spec Workflow](https://github.com/pimzino/claude-code-spec-workflow)\n`;
    
    return body;
  }

  private buildTaskBody(task: ParsedTask, specName: string, epicNumber: number): string {
    let body = `## Task ${task.id}: ${task.description}\n\n`;
    body += `**Epic**: #${epicNumber}\n`;
    body += `**Spec**: ${specName}\n\n`;
    
    if (task.requirements) {
      body += `### Requirements\n${task.requirements}\n\n`;
    }
    
    if (task.leverage) {
      body += `### Code Reuse\n${task.leverage}\n\n`;
    }
    
    body += `### Acceptance Criteria\n`;
    body += `- [ ] Task implementation completed\n`;
    body += `- [ ] Code follows project conventions\n`;
    body += `- [ ] Tests pass (if applicable)\n`;
    body += `- [ ] Ready for code review\n\n`;
    
    body += `---\n`;
    body += `🤖 Generated with [Claude Code Spec Workflow](https://github.com/pimzino/claude-code-spec-workflow)\n`;
    
    return body;
  }

  private extractRequirementsSummary(requirements: any): string {
    if (typeof requirements === 'string') {
      return requirements.substring(0, 200) + (requirements.length > 200 ? '...' : '');
    }
    return 'Requirements defined in specification document.';
  }

  private extractDesignSummary(design: any): string {
    if (typeof design === 'string') {
      return design.substring(0, 200) + (design.length > 200 ? '...' : '');
    }
    return 'Design defined in specification document.';
  }

  private generatePRTitle(branchName: string): string {
    // Extract meaningful info from branch name (e.g., "feature/123-user-auth" -> "User Auth")
    const parts = branchName.split('/');
    const featurePart = parts[parts.length - 1];
    const cleaned = featurePart
      .replace(/^\d+-/, '') // Remove leading numbers
      .replace(/-/g, ' ') // Replace hyphens with spaces
      .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
    
    return `feat: ${cleaned}`;
  }

  private generatePRBody(branchName: string): string {
    let body = `## Summary\n`;
    body += `This PR implements the feature branch: \`${branchName}\`\n\n`;
    body += `## Changes\n`;
    body += `- [ ] Feature implementation\n`;
    body += `- [ ] Tests added/updated\n`;
    body += `- [ ] Documentation updated\n\n`;
    body += `## Test Plan\n`;
    body += `- [ ] Manual testing completed\n`;
    body += `- [ ] Automated tests pass\n\n`;
    body += `---\n`;
    body += `🤖 Generated with [Claude Code Spec Workflow](https://github.com/pimzino/claude-code-spec-workflow)\n`;
    
    return body;
  }
}