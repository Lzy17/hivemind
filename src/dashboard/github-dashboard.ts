import { GitHubIntegration, Issue, PullRequest } from '../collaboration/github-integration';
import { TeamManager } from '../auth/team-manager';

export interface KanbanView {
  backlog: KanbanItem[];
  inProgress: KanbanItem[];
  inReview: KanbanItem[];
  done: KanbanItem[];
}

export interface KanbanItem {
  id: string;
  title: string;
  type: 'issue' | 'pr';
  assignee?: string;
  labels: string[];
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HeatmapView {
  contributors: ContributorActivity[];
  dateRange: { start: Date; end: Date };
  totalCommits: number;
  totalPRs: number;
}

export interface ContributorActivity {
  username: string;
  commits: number;
  prs: number;
  reviews: number;
  score: number;
}

export interface ChartView {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
  }[];
}

export interface TrendsView {
  codeQuality: QualityMetric[];
  velocity: VelocityMetric[];
  bugRate: BugRateMetric[];
}

export interface QualityMetric {
  date: Date;
  testCoverage: number;
  codeComplexity: number;
  techDebt: number;
}

export interface VelocityMetric {
  week: string;
  issuesCompleted: number;
  storyPoints: number;
  cycleTime: number;
}

export interface BugRateMetric {
  date: Date;
  bugsFound: number;
  bugsFixed: number;
  bugBacklog: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface MilestoneConfig {
  title: string;
  description: string;
  dueDate: Date;
  issues: number[];
}

export class GitHubDashboard {
  private github: GitHubIntegration;
  private teamManager: TeamManager;

  constructor(github: GitHubIntegration, teamManager: TeamManager) {
    this.github = github;
    this.teamManager = teamManager;
  }

  async renderPRKanban(repos: string[]): Promise<KanbanView> {
    const issues = await this.github.getOpenIssues();
    const prs = await this.github.getPendingPRs();

    // Convert issues and PRs to kanban items
    const issueItems: KanbanItem[] = issues.map(issue => ({
      id: `issue-${issue.number}`,
      title: issue.title,
      type: 'issue' as const,
      assignee: issue.assignee,
      labels: issue.labels,
      url: issue.html_url,
      createdAt: new Date(), // Would get from API in real implementation
      updatedAt: new Date(),
    }));

    const prItems: KanbanItem[] = prs.map(pr => ({
      id: `pr-${pr.number}`,
      title: pr.title,
      type: 'pr' as const,
      assignee: undefined, // Would get PR author from API
      labels: [], // Would get PR labels from API
      url: pr.html_url,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Categorize items (simplified logic)
    const allItems = [...issueItems, ...prItems];
    
    const kanban: KanbanView = {
      backlog: allItems.filter(item => 
        item.type === 'issue' && !item.assignee
      ),
      inProgress: allItems.filter(item => 
        item.type === 'issue' && item.assignee
      ),
      inReview: allItems.filter(item => item.type === 'pr'),
      done: [], // Would need to fetch closed items
    };

    return kanban;
  }

  async renderContributorHeatmap(timeRange: DateRange): Promise<HeatmapView> {
    // In a real implementation, this would fetch contributor stats from GitHub API
    const contributors: ContributorActivity[] = [
      {
        username: 'alice',
        commits: 45,
        prs: 12,
        reviews: 18,
        score: 85,
      },
      {
        username: 'bob',
        commits: 32,
        prs: 8,
        reviews: 15,
        score: 72,
      },
      {
        username: 'charlie',
        commits: 28,
        prs: 6,
        reviews: 22,
        score: 68,
      },
    ];

    return {
      contributors,
      dateRange: timeRange,
      totalCommits: contributors.reduce((sum, c) => sum + c.commits, 0),
      totalPRs: contributors.reduce((sum, c) => sum + c.prs, 0),
    };
  }

  async renderVelocityChart(teamId: string): Promise<ChartView> {
    // Fetch team velocity data
    const team = this.teamManager.getTeam(teamId);
    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }

    // Simplified velocity data - in real implementation, analyze historical data
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const completedIssues = [8, 12, 10, 14];
    const storyPoints = [21, 32, 28, 35];

    return {
      labels: weeks,
      datasets: [
        {
          label: 'Issues Completed',
          data: completedIssues,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
        },
        {
          label: 'Story Points',
          data: storyPoints,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
        },
      ],
    };
  }

  async renderCodeQualityTrends(): Promise<TrendsView> {
    // Generate sample quality trends data
    const dates = this.generateDateRange(30); // Last 30 days
    
    const codeQuality: QualityMetric[] = dates.map((date, index) => ({
      date,
      testCoverage: 75 + Math.random() * 15, // 75-90%
      codeComplexity: 3 + Math.random() * 2, // 3-5 complexity
      techDebt: 20 - index * 0.5 + Math.random() * 5, // Decreasing tech debt
    }));

    const velocity: VelocityMetric[] = this.generateWeeklyData(4).map((week, index) => ({
      week: `Week ${index + 1}`,
      issuesCompleted: 8 + Math.floor(Math.random() * 8),
      storyPoints: 20 + Math.floor(Math.random() * 15),
      cycleTime: 2 + Math.random() * 3, // 2-5 days
    }));

    const bugRate: BugRateMetric[] = dates.filter((_, i) => i % 7 === 0).map(date => ({
      date,
      bugsFound: Math.floor(Math.random() * 5),
      bugsFixed: Math.floor(Math.random() * 6),
      bugBacklog: 8 + Math.floor(Math.random() * 10),
    }));

    return {
      codeQuality,
      velocity,
      bugRate,
    };
  }

  async bulkAssignIssues(issues: Issue[], assignee: string): Promise<void> {
    const promises = issues.map(issue => 
      this.github.autoAssignIssue(issue, [{ username: assignee, skills: [], workload: 0 }])
    );

    await Promise.all(promises);
    console.log(`✅ Assigned ${issues.length} issues to ${assignee}`);
  }

  async bulkUpdateLabels(issues: Issue[], labels: string[]): Promise<void> {
    // In a real implementation, this would use GitHub API to update labels
    console.log(`📝 Updated labels for ${issues.length} issues:`, labels);
    
    // Placeholder for bulk label update logic
    for (const issue of issues) {
      console.log(`  - Issue #${issue.number}: Added labels ${labels.join(', ')}`);
    }
  }

  async createMilestone(repo: string, milestone: MilestoneConfig): Promise<void> {
    // In a real implementation, this would create a GitHub milestone
    console.log(`🎯 Creating milestone: ${milestone.title}`);
    console.log(`  Description: ${milestone.description}`);
    console.log(`  Due date: ${milestone.dueDate.toISOString()}`);
    console.log(`  Issues: ${milestone.issues.join(', ')}`);

    // Placeholder for milestone creation logic
  }

  async getTeamMetrics(teamId: string) {
    const team = this.teamManager.getTeam(teamId);
    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }

    const issues = await this.github.getOpenIssues();
    const prs = await this.github.getPendingPRs();
    
    // Calculate team-specific metrics
    const teamIssues = issues.filter(issue => 
      team.members.some(member => member.username === issue.assignee)
    );

    const memberActivity = await Promise.all(
      team.members.map(async member => {
        const workload = await this.teamManager.calculateWorkload(member.username);
        const skills = await this.teamManager.analyzeSkills(member.username);
        return {
          username: member.username,
          openIssues: workload.openIssues,
          openPRs: workload.openPRs,
          capacity: workload.currentCapacity,
          velocity: skills.velocity,
        };
      })
    );

    return {
      teamName: team.name,
      memberCount: team.members.length,
      activeIssues: teamIssues.length,
      totalPRs: prs.length, // Simplified - would filter by team in real implementation
      memberActivity,
      averageCapacity: memberActivity.reduce((sum, m) => sum + m.capacity, 0) / team.members.length,
      averageVelocity: memberActivity.reduce((sum, m) => sum + m.velocity, 0) / team.members.length,
    };
  }

  // Helper methods
  private generateDateRange(days: number): Date[] {
    const dates: Date[] = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      dates.push(date);
    }
    
    return dates;
  }

  private generateWeeklyData(weeks: number): string[] {
    const weeklyData: string[] = [];
    
    for (let i = 0; i < weeks; i++) {
      weeklyData.push(`Week ${i + 1}`);
    }
    
    return weeklyData;
  }
}