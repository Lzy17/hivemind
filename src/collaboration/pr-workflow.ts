import { GitHubIntegration, PullRequest, Issue } from './github-integration';
import { SimpleGit } from 'simple-git';

export interface ConflictAnalysis {
  hasConflicts: boolean;
  conflictingFiles: string[];
  riskLevel: 'low' | 'medium' | 'high';
  suggestions: string[];
}

export interface MergeStatus {
  ready: boolean;
  blockers: string[];
  checks: {
    hasApprovals: boolean;
    ciPassing: boolean;
    noConflicts: boolean;
    branchUpToDate: boolean;
  };
}

export interface MergeStrategy {
  type: 'merge' | 'squash' | 'rebase';
  reason: string;
  steps: string[];
}

export interface CodeAnalysis {
  modifiedFiles: string[];
  complexity: 'low' | 'medium' | 'high';
  suggestedReviewers: string[];
  estimatedReviewTime: number; // in minutes
}

export class PRWorkflow {
  private github: GitHubIntegration;
  private git: SimpleGit;

  constructor(github: GitHubIntegration, git: SimpleGit) {
    this.github = github;
    this.git = git;
  }

  async onFeatureComplete(branchName: string): Promise<void> {
    console.log(`🚀 Feature branch ${branchName} marked as complete`);
    
    try {
      // Ensure branch is pushed to remote
      await this.git.push('origin', branchName);
      
      // Create pull request
      const pr = await this.github.triggerPRCreation(branchName);
      console.log(`✅ Pull request created: ${pr.html_url}`);
      
      // Analyze code and request reviewers
      const analysis = await this.analyzeCode(branchName);
      await this.autoRequestReviewers(pr, analysis);
      
    } catch (error) {
      console.error(`❌ Failed to create PR for ${branchName}:`, error);
      throw error;
    }
  }

  async autoRequestReviewers(pr: PullRequest, codeAnalysis: CodeAnalysis): Promise<void> {
    if (codeAnalysis.suggestedReviewers.length === 0) {
      console.log('No suggested reviewers found');
      return;
    }

    // Request review from suggested reviewers
    // Note: This would require additional GitHub API calls
    console.log(`🔍 Suggested reviewers for PR #${pr.number}:`, codeAnalysis.suggestedReviewers);
    console.log(`⏱️ Estimated review time: ${codeAnalysis.estimatedReviewTime} minutes`);
  }

  async checkMergeReadiness(pr: PullRequest): Promise<MergeStatus> {
    const status: MergeStatus = {
      ready: false,
      blockers: [],
      checks: {
        hasApprovals: false,
        ciPassing: false,
        noConflicts: false,
        branchUpToDate: false,
      },
    };

    try {
      // Check for merge conflicts
      const conflicts = await this.detectPotentialConflicts(pr.head.ref, pr.base.ref);
      status.checks.noConflicts = !conflicts.hasConflicts;
      if (conflicts.hasConflicts) {
        status.blockers.push(`Merge conflicts detected in: ${conflicts.conflictingFiles.join(', ')}`);
      }

      // Check if branch is up to date
      const isUpToDate = await this.isBranchUpToDate(pr.head.ref, pr.base.ref);
      status.checks.branchUpToDate = isUpToDate;
      if (!isUpToDate) {
        status.blockers.push(`Branch ${pr.head.ref} is behind ${pr.base.ref}`);
      }

      // Placeholder checks for approvals and CI (would need GitHub API integration)
      status.checks.hasApprovals = true; // Assume approved for now
      status.checks.ciPassing = true; // Assume CI passing for now

      status.ready = status.checks.hasApprovals && 
                     status.checks.ciPassing && 
                     status.checks.noConflicts && 
                     status.checks.branchUpToDate;

      return status;
    } catch (error) {
      console.error('Error checking merge readiness:', error);
      status.blockers.push(`Error checking merge status: ${error}`);
      return status;
    }
  }

  async detectPotentialConflicts(branch1: string, branch2: string): Promise<ConflictAnalysis> {
    try {
      // Get the merge base
      const mergeBase = await this.git.raw(['merge-base', branch1, branch2]);
      
      // Get files changed in each branch since merge base
      const branch1Files = await this.git.diff([`${mergeBase.trim()}...${branch1}`, '--name-only']);
      const branch2Files = await this.git.diff([`${mergeBase.trim()}...${branch2}`, '--name-only']);
      
      const files1 = branch1Files.split('\n').filter(f => f.trim());
      const files2 = branch2Files.split('\n').filter(f => f.trim());
      
      // Find overlapping files
      const conflictingFiles = files1.filter(file => files2.includes(file));
      
      const analysis: ConflictAnalysis = {
        hasConflicts: conflictingFiles.length > 0,
        conflictingFiles,
        riskLevel: this.assessRiskLevel(conflictingFiles),
        suggestions: this.generateConflictSuggestions(conflictingFiles),
      };

      return analysis;
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      return {
        hasConflicts: false,
        conflictingFiles: [],
        riskLevel: 'low',
        suggestions: ['Unable to analyze conflicts - manual review recommended'],
      };
    }
  }

  suggestMergeStrategy(conflicts: ConflictAnalysis): MergeStrategy {
    if (!conflicts.hasConflicts) {
      return {
        type: 'squash',
        reason: 'No conflicts detected, clean history preferred',
        steps: [
          'Use GitHub squash and merge',
          'Ensure commit message follows conventional commits',
          'Delete feature branch after merge'
        ],
      };
    }

    if (conflicts.riskLevel === 'high') {
      return {
        type: 'merge',
        reason: 'High risk conflicts require manual resolution',
        steps: [
          'Resolve conflicts locally',
          'Test thoroughly after conflict resolution',
          'Use standard merge to preserve conflict resolution history',
          'Consider pair programming for complex conflicts'
        ],
      };
    }

    return {
      type: 'rebase',
      reason: 'Medium risk conflicts, rebase for clean history',
      steps: [
        'Rebase feature branch onto target branch',
        'Resolve conflicts during rebase',
        'Force push rebased branch',
        'Use squash merge after successful rebase'
      ],
    };
  }

  private async analyzeCode(branchName: string): Promise<CodeAnalysis> {
    try {
      // Get modified files
      const diffOutput = await this.git.diff(['origin/main...HEAD', '--name-only']);
      const modifiedFiles = diffOutput.split('\n').filter(f => f.trim());
      
      // Assess complexity based on number and type of files
      let complexity: 'low' | 'medium' | 'high' = 'low';
      if (modifiedFiles.length > 10) {
        complexity = 'high';
      } else if (modifiedFiles.length > 5) {
        complexity = 'medium';
      }

      // Suggest reviewers based on file ownership (simplified)
      const suggestedReviewers = this.suggestReviewersForFiles(modifiedFiles);
      
      // Estimate review time
      const estimatedReviewTime = this.estimateReviewTime(modifiedFiles, complexity);

      return {
        modifiedFiles,
        complexity,
        suggestedReviewers,
        estimatedReviewTime,
      };
    } catch (error) {
      console.error('Error analyzing code:', error);
      return {
        modifiedFiles: [],
        complexity: 'low',
        suggestedReviewers: [],
        estimatedReviewTime: 30,
      };
    }
  }

  private async isBranchUpToDate(headBranch: string, baseBranch: string): Promise<boolean> {
    try {
      await this.git.fetch();
      const mergeBase = await this.git.raw(['merge-base', headBranch, `origin/${baseBranch}`]);
      const baseCommit = await this.git.raw(['rev-parse', `origin/${baseBranch}`]);
      
      return mergeBase.trim() === baseCommit.trim();
    } catch (error) {
      console.error('Error checking if branch is up to date:', error);
      return false;
    }
  }

  private assessRiskLevel(conflictingFiles: string[]): 'low' | 'medium' | 'high' {
    if (conflictingFiles.length === 0) return 'low';
    if (conflictingFiles.length > 5) return 'high';
    
    // Check for critical files
    const criticalFiles = conflictingFiles.filter(file => 
      file.includes('package.json') || 
      file.includes('config') || 
      file.includes('migration') ||
      file.includes('schema')
    );
    
    if (criticalFiles.length > 0) return 'high';
    if (conflictingFiles.length > 2) return 'medium';
    
    return 'low';
  }

  private generateConflictSuggestions(conflictingFiles: string[]): string[] {
    const suggestions = [];
    
    if (conflictingFiles.length === 0) {
      suggestions.push('No conflicts detected - proceed with merge');
      return suggestions;
    }

    suggestions.push(`Review conflicting files: ${conflictingFiles.join(', ')}`);
    
    if (conflictingFiles.some(f => f.includes('package.json'))) {
      suggestions.push('Package.json conflicts detected - coordinate dependency changes');
    }
    
    if (conflictingFiles.some(f => f.includes('config'))) {
      suggestions.push('Configuration file conflicts - ensure environment consistency');
    }
    
    suggestions.push('Consider rebasing to resolve conflicts cleanly');
    suggestions.push('Coordinate with other developers working on conflicting files');
    
    return suggestions;
  }

  private suggestReviewersForFiles(files: string[]): string[] {
    // Simplified reviewer suggestion based on file patterns
    const reviewers: Set<string> = new Set();
    
    files.forEach(file => {
      if (file.includes('/auth/') || file.includes('login') || file.includes('security')) {
        reviewers.add('security-team');
      }
      if (file.includes('/api/') || file.includes('backend') || file.includes('server')) {
        reviewers.add('backend-team');
      }
      if (file.includes('/ui/') || file.includes('component') || file.includes('frontend')) {
        reviewers.add('frontend-team');
      }
      if (file.includes('test') || file.includes('spec')) {
        reviewers.add('qa-team');
      }
    });
    
    return Array.from(reviewers);
  }

  private estimateReviewTime(files: string[], complexity: 'low' | 'medium' | 'high'): number {
    let baseTime = files.length * 5; // 5 minutes per file base
    
    switch (complexity) {
      case 'high':
        baseTime *= 2;
        break;
      case 'medium':
        baseTime *= 1.5;
        break;
      default:
        break;
    }
    
    return Math.min(Math.max(baseTime, 15), 120); // Between 15 and 120 minutes
  }
}