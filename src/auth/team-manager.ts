import { GitHubIntegration, Issue, TeamMember } from '../collaboration/github-integration';

export interface Team {
  id: string;
  name: string;
  githubOrg: string;
  members: TeamMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillProfile {
  languages: { [key: string]: number };
  domains: { [key: string]: number };
  reviewQuality: number;
  velocity: number;
  lastUpdated: Date;
}

export interface WorkloadMetrics {
  openIssues: number;
  openPRs: number;
  avgCompletionTime: number; // in days
  currentCapacity: number; // 0-1 scale
  lastUpdated: Date;
}

export enum TeamRole {
  MEMBER = 'member',
  LEAD = 'lead',
  ADMIN = 'admin'
}

export class TeamManager {
  private github: GitHubIntegration;
  private teams: Map<string, Team> = new Map();
  private skillProfiles: Map<string, SkillProfile> = new Map();
  private workloadMetrics: Map<string, WorkloadMetrics> = new Map();

  constructor(github: GitHubIntegration) {
    this.github = github;
  }

  async createTeam(name: string, githubOrg: string): Promise<Team> {
    const team: Team = {
      id: this.generateTeamId(),
      name,
      githubOrg,
      members: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.teams.set(team.id, team);
    console.log(`✅ Team "${name}" created with ID: ${team.id}`);
    
    return team;
  }

  async addMember(teamId: string, githubUsername: string, role: TeamRole = TeamRole.MEMBER): Promise<void> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error(`Team with ID ${teamId} not found`);
    }

    // Check if member already exists
    if (team.members.some(m => m.username === githubUsername)) {
      throw new Error(`Member ${githubUsername} already exists in team ${team.name}`);
    }

    // Analyze skills for the new member
    const skillProfile = await this.analyzeSkills(githubUsername);
    const workload = await this.calculateWorkload(githubUsername);

    const newMember: TeamMember = {
      username: githubUsername,
      skills: Object.keys(skillProfile.languages).concat(Object.keys(skillProfile.domains)),
      workload: workload.currentCapacity,
    };

    team.members.push(newMember);
    team.updatedAt = new Date();
    
    console.log(`✅ Added ${githubUsername} to team "${team.name}" as ${role}`);
  }

  async removeMember(teamId: string, githubUsername: string): Promise<void> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error(`Team with ID ${teamId} not found`);
    }

    const memberIndex = team.members.findIndex(m => m.username === githubUsername);
    if (memberIndex === -1) {
      throw new Error(`Member ${githubUsername} not found in team ${team.name}`);
    }

    team.members.splice(memberIndex, 1);
    team.updatedAt = new Date();
    
    console.log(`✅ Removed ${githubUsername} from team "${team.name}"`);
  }

  async analyzeSkills(githubUsername: string): Promise<SkillProfile> {
    // Check cache first
    const cached = this.skillProfiles.get(githubUsername);
    if (cached && this.isCacheValid(cached.lastUpdated, 24 * 60 * 60 * 1000)) { // 24 hours
      return cached;
    }

    console.log(`🔍 Analyzing skills for ${githubUsername}...`);
    
    try {
      // This is a simplified implementation
      // In a real scenario, you'd analyze GitHub activity, commits, PRs, etc.
      const skillProfile: SkillProfile = {
        languages: await this.analyzeLanguageSkills(githubUsername),
        domains: await this.analyzeDomainExpertise(githubUsername),
        reviewQuality: await this.analyzeReviewQuality(githubUsername),
        velocity: await this.analyzeVelocity(githubUsername),
        lastUpdated: new Date(),
      };

      this.skillProfiles.set(githubUsername, skillProfile);
      return skillProfile;
    } catch (error) {
      console.error(`❌ Error analyzing skills for ${githubUsername}:`, error);
      
      // Return default profile on error
      const defaultProfile: SkillProfile = {
        languages: {},
        domains: {},
        reviewQuality: 0.5,
        velocity: 0.5,
        lastUpdated: new Date(),
      };
      
      return defaultProfile;
    }
  }

  async calculateWorkload(githubUsername: string): Promise<WorkloadMetrics> {
    // Check cache first
    const cached = this.workloadMetrics.get(githubUsername);
    if (cached && this.isCacheValid(cached.lastUpdated, 60 * 60 * 1000)) { // 1 hour
      return cached;
    }

    console.log(`📊 Calculating workload for ${githubUsername}...`);
    
    try {
      const openIssues = await this.getOpenIssuesForUser(githubUsername);
      const openPRs = await this.getOpenPRsForUser(githubUsername);
      
      const workload: WorkloadMetrics = {
        openIssues: openIssues.length,
        openPRs: openPRs.length,
        avgCompletionTime: await this.calculateAvgCompletionTime(githubUsername),
        currentCapacity: this.calculateCapacity(openIssues.length, openPRs.length),
        lastUpdated: new Date(),
      };

      this.workloadMetrics.set(githubUsername, workload);
      return workload;
    } catch (error) {
      console.error(`❌ Error calculating workload for ${githubUsername}:`, error);
      
      const defaultWorkload: WorkloadMetrics = {
        openIssues: 0,
        openPRs: 0,
        avgCompletionTime: 3,
        currentCapacity: 0.5,
        lastUpdated: new Date(),
      };
      
      return defaultWorkload;
    }
  }

  async suggestAssignee(issue: Issue, team: Team): Promise<string> {
    if (team.members.length === 0) {
      throw new Error('No team members available for assignment');
    }

    console.log(`🤖 Suggesting assignee for issue: ${issue.title}`);
    
    // Get workload for all members
    const memberWorkloads = await Promise.all(
      team.members.map(async (member) => {
        const workload = await this.calculateWorkload(member.username);
        const skills = await this.analyzeSkills(member.username);
        
        return {
          member,
          workload,
          skills,
          score: this.calculateAssignmentScore(issue, member, workload, skills),
        };
      })
    );

    // Sort by assignment score (higher is better)
    memberWorkloads.sort((a, b) => b.score - a.score);
    
    const bestMember = memberWorkloads[0];
    console.log(`✅ Suggested assignee: ${bestMember.member.username} (score: ${bestMember.score.toFixed(2)})`);
    
    return bestMember.member.username;
  }

  getTeam(teamId: string): Team | undefined {
    return this.teams.get(teamId);
  }

  getAllTeams(): Team[] {
    return Array.from(this.teams.values());
  }

  private generateTeamId(): string {
    return `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isCacheValid(lastUpdated: Date, maxAge: number): boolean {
    return Date.now() - lastUpdated.getTime() < maxAge;
  }

  private async analyzeLanguageSkills(username: string): Promise<{ [key: string]: number }> {
    // Simplified implementation - in reality, analyze commit history
    return {
      'TypeScript': 0.8,
      'JavaScript': 0.9,
      'Python': 0.6,
    };
  }

  private async analyzeDomainExpertise(username: string): Promise<{ [key: string]: number }> {
    // Simplified implementation - in reality, analyze repository contributions
    return {
      'frontend': 0.7,
      'backend': 0.8,
      'devops': 0.5,
    };
  }

  private async analyzeReviewQuality(username: string): Promise<number> {
    // Simplified implementation - in reality, analyze PR review history
    return 0.75; // 75% quality score
  }

  private async analyzeVelocity(username: string): Promise<number> {
    // Simplified implementation - in reality, analyze issue completion rates
    return 0.8; // 80% velocity score
  }

  private async getOpenIssuesForUser(username: string): Promise<Issue[]> {
    const allIssues = await this.github.getOpenIssues();
    return allIssues.filter(issue => issue.assignee === username);
  }

  private async getOpenPRsForUser(username: string): Promise<any[]> {
    const allPRs = await this.github.getPendingPRs();
    // In reality, you'd filter by assignee/author
    return allPRs.filter(pr => pr.title.includes(username)); // Simplified
  }

  private async calculateAvgCompletionTime(username: string): Promise<number> {
    // Simplified implementation - in reality, analyze historical data
    return 3; // 3 days average
  }

  private calculateCapacity(openIssues: number, openPRs: number): number {
    // Simple capacity calculation: inverse of current workload
    const totalWork = openIssues + (openPRs * 2); // PRs count double
    const maxCapacity = 10; // Assume max 10 items
    
    return Math.max(0, 1 - (totalWork / maxCapacity));
  }

  private calculateAssignmentScore(
    issue: Issue,
    member: TeamMember,
    workload: WorkloadMetrics,
    skills: SkillProfile
  ): number {
    let score = 0;
    
    // Capacity score (higher capacity = better)
    score += workload.currentCapacity * 40;
    
    // Velocity score
    score += skills.velocity * 30;
    
    // Skill matching (simplified)
    const issueText = (issue.title + ' ' + issue.body).toLowerCase();
    let skillMatch = 0;
    
    Object.keys(skills.languages).forEach(lang => {
      if (issueText.includes(lang.toLowerCase())) {
        skillMatch += skills.languages[lang];
      }
    });
    
    Object.keys(skills.domains).forEach(domain => {
      if (issueText.includes(domain.toLowerCase())) {
        skillMatch += skills.domains[domain];
      }
    });
    
    score += skillMatch * 20;
    
    // Review quality bonus
    score += skills.reviewQuality * 10;
    
    return score;
  }
}