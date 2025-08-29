import { 
  CommandInteraction, 
  SlashCommandBuilder, 
  EmbedBuilder, 
  AttachmentBuilder,
  ChatInputCommandInteraction,
  SlashCommandOptionsOnlyBuilder
} from 'discord.js';
import { GitHubIntegration } from '../../collaboration/github-integration';
import { TeamManager } from '../../auth/team-manager';
import { PRWorkflow } from '../../collaboration/pr-workflow';
import { SimpleGit } from 'simple-git';

export interface DiscordCommand {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export class GitHubDiscordCommands {
  private github: GitHubIntegration;
  private teamManager: TeamManager;
  private prWorkflow: PRWorkflow;
  private git: SimpleGit;

  constructor(github: GitHubIntegration, teamManager: TeamManager, git: SimpleGit) {
    this.github = github;
    this.teamManager = teamManager;
    this.git = git;
    this.prWorkflow = new PRWorkflow(github, git);
  }

  getCommands(): DiscordCommand[] {
    return [
      {
        data: new SlashCommandBuilder()
          .setName('issue-claim')
          .setDescription('Claim a GitHub issue and create feature branch')
          .addIntegerOption(option =>
            option.setName('issue_number')
              .setDescription('GitHub issue number to claim')
              .setRequired(true)
          ),
        execute: this.issueClaimHandler.bind(this),
      },
      {
        data: new SlashCommandBuilder()
          .setName('pr-ready')
          .setDescription('Mark feature branch as ready for pull request')
          .addStringOption(option =>
            option.setName('branch_name')
              .setDescription('Feature branch name')
              .setRequired(true)
          ),
        execute: this.prReadyHandler.bind(this),
      },
      {
        data: new SlashCommandBuilder()
          .setName('team-status')
          .setDescription('Show current team workflow status')
          .addStringOption(option =>
            option.setName('team_id')
              .setDescription('Team ID (optional - shows all teams if not specified)')
              .setRequired(false)
          ),
        execute: this.teamStatusHandler.bind(this),
      },
      {
        data: new SlashCommandBuilder()
          .setName('issue-assign')
          .setDescription('Assign GitHub issue to team member')
          .addIntegerOption(option =>
            option.setName('issue_number')
              .setDescription('GitHub issue number')
              .setRequired(true)
          )
          .addUserOption(option =>
            option.setName('assignee')
              .setDescription('Discord user to assign (will map to GitHub username)')
              .setRequired(true)
          ),
        execute: this.issueAssignHandler.bind(this),
      },
      {
        data: new SlashCommandBuilder()
          .setName('branch-status')
          .setDescription('Check status of a feature branch')
          .addStringOption(option =>
            option.setName('branch_name')
              .setDescription('Feature branch name')
              .setRequired(true)
          ),
        execute: this.branchStatusHandler.bind(this),
      },
    ];
  }

  private async issueClaimHandler(interaction: ChatInputCommandInteraction): Promise<void> {
    const issueNumber = interaction.options.get('issue_number')?.value as number;
    const discordUser = interaction.user;

    await interaction.deferReply();

    try {
      // 1. Verify user GitHub identity (simplified - in real implementation, maintain user mapping)
      const githubUsername = await this.getGitHubUsername(discordUser.id);
      
      // 2. Get issue details
      const issues = await this.github.getOpenIssues();
      const issue = issues.find(i => i.number === issueNumber);
      
      if (!issue) {
        await interaction.editReply(`❌ Issue #${issueNumber} not found or is closed`);
        return;
      }

      // 3. Check if issue is already assigned
      if (issue.assignee) {
        await interaction.editReply(`❌ Issue #${issueNumber} is already assigned to @${issue.assignee}`);
        return;
      }

      // 4. Auto-assign issue
      await this.github.autoAssignIssue(issue, [{ username: githubUsername, skills: [], workload: 0 }]);

      // 5. Create feature branch
      const branchName = this.generateBranchName(issue);
      await this.github.createBranch(branchName);

      // 6. Send confirmation with next steps
      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`✅ Issue #${issueNumber} Claimed Successfully`)
        .setDescription(issue.title)
        .addFields(
          { name: '📋 Issue', value: `[#${issueNumber}](${issue.html_url})`, inline: true },
          { name: '🌿 Branch', value: `\`${branchName}\``, inline: true },
          { name: '👤 Assignee', value: `@${githubUsername}`, inline: true },
          { name: '🚀 Next Steps', value: 
            `1. \`git checkout -b ${branchName}\`\n` +
            `2. Start development work\n` +
            `3. Use \`/pr-ready ${branchName}\` when complete`, 
            inline: false 
          }
        )
        .setFooter({ text: '🤖 Claude Code Spec Workflow' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error claiming issue:', error);
      await interaction.editReply(`❌ Failed to claim issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async prReadyHandler(interaction: ChatInputCommandInteraction): Promise<void> {
    const branchName = interaction.options.get('branch_name')?.value as string;
    
    await interaction.deferReply();

    try {
      // 1. Check branch status and CI results
      const branchExists = await this.checkBranchExists(branchName);
      if (!branchExists) {
        await interaction.editReply(`❌ Branch \`${branchName}\` not found`);
        return;
      }

      // 2. Auto-create pull request
      await this.prWorkflow.onFeatureComplete(branchName);
      const prs = await this.github.getPendingPRs();
      const pr = prs.find(p => p.head.ref === branchName);

      // 3. Request code review (placeholder - would need GitHub integration)
      const reviewers = ['team-lead']; // Simplified reviewer assignment

      // 4. Send success message
      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle(`🚀 Pull Request Created`)
        .setDescription(`Feature branch \`${branchName}\` is ready for review`)
        .addFields(
          { name: '🔀 Pull Request', value: `[View PR](${pr?.html_url || 'PR created'})`, inline: true },
          { name: '👀 Reviewers', value: reviewers.map(r => `@${r}`).join(', '), inline: true },
          { name: '✅ Next Steps', value: 
            '1. Code review in progress\n' +
            '2. Address any feedback\n' +
            '3. Merge when approved', 
            inline: false 
          }
        )
        .setFooter({ text: '🤖 Claude Code Spec Workflow' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

      // 5. Notify team members about new PR
      await this.notifyTeamMembers(interaction, `New PR ready for review: ${branchName}`);

    } catch (error) {
      console.error('Error creating PR:', error);
      await interaction.editReply(`❌ Failed to create PR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async teamStatusHandler(interaction: ChatInputCommandInteraction): Promise<void> {
    const teamId = interaction.options.get('team_id')?.value as string;
    
    await interaction.deferReply();

    try {
      const teams = teamId 
        ? [this.teamManager.getTeam(teamId)].filter((t): t is NonNullable<typeof t> => t !== undefined)
        : this.teamManager.getAllTeams();

      if (teams.length === 0) {
        await interaction.editReply('❌ No teams found');
        return;
      }

      // Get GitHub data
      const openIssues = await this.github.getOpenIssues();
      const openPRs = await this.github.getPendingPRs();

      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('📊 Team Workflow Status')
        .setDescription(`Current status across ${teams.length} team(s)`)
        .addFields(
          { name: '📋 Open Issues', value: openIssues.length.toString(), inline: true },
          { name: '🔀 Open PRs', value: openPRs.length.toString(), inline: true },
          { name: '👥 Active Members', value: teams.reduce((acc, t) => acc + t.members.length, 0).toString(), inline: true }
        );

      // Add team-specific information  
      for (const team of teams.slice(0, 3)) { // Limit to 3 teams for embed size
        const teamIssues = openIssues.filter(issue => 
          team.members.some(member => member.username === issue.assignee)
        );
        
        const memberStatus = await Promise.all(
          team.members.slice(0, 5).map(async member => {
            const workload = await this.teamManager.calculateWorkload(member.username);
            const capacity = Math.round(workload.currentCapacity * 100);
            return `@${member.username} (${capacity}% capacity)`;
          })
        );

        embed.addFields({
          name: `🏷️ Team: ${team.name}`,
          value: 
            `**Issues**: ${teamIssues.length}\n` +
            `**Members**: ${memberStatus.join('\n')}`,
          inline: false
        });
      }

      embed.setFooter({ text: '🤖 Use /issue-claim to claim issues' })
           .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error getting team status:', error);
      await interaction.editReply(`❌ Failed to get team status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async issueAssignHandler(interaction: ChatInputCommandInteraction): Promise<void> {
    const issueNumber = interaction.options.get('issue_number')?.value as number;
    const assigneeUser = interaction.options.getUser('assignee');

    await interaction.deferReply();

    try {
      const githubUsername = await this.getGitHubUsername(assigneeUser!.id);
      
      const issues = await this.github.getOpenIssues();
      const issue = issues.find(i => i.number === issueNumber);
      
      if (!issue) {
        await interaction.editReply(`❌ Issue #${issueNumber} not found`);
        return;
      }

      await this.github.autoAssignIssue(issue, [{ username: githubUsername, skills: [], workload: 0 }]);

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle(`✅ Issue Assigned`)
        .setDescription(`Issue #${issueNumber} has been assigned to @${githubUsername}`)
        .addFields(
          { name: '📋 Issue', value: `[${issue.title}](${issue.html_url})`, inline: false },
          { name: '👤 Assignee', value: `<@${assigneeUser!.id}> (@${githubUsername})`, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error assigning issue:', error);
      await interaction.editReply(`❌ Failed to assign issue: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async branchStatusHandler(interaction: ChatInputCommandInteraction): Promise<void> {
    const branchName = interaction.options.get('branch_name')?.value as string;
    
    await interaction.deferReply();

    try {
      const branchExists = await this.checkBranchExists(branchName);
      if (!branchExists) {
        await interaction.editReply(`❌ Branch \`${branchName}\` not found`);
        return;
      }

      // Get branch information
      const branchInfo = await this.getBranchInfo(branchName);
      const conflicts = await this.prWorkflow.detectPotentialConflicts(branchName, 'main');

      const embed = new EmbedBuilder()
        .setColor(conflicts.hasConflicts ? 0xFF0000 : 0x00FF00)
        .setTitle(`🌿 Branch Status: \`${branchName}\``)
        .addFields(
          { name: '📊 Commits', value: branchInfo.commitCount.toString(), inline: true },
          { name: '📝 Last Updated', value: branchInfo.lastCommit, inline: true },
          { name: '🔀 Conflicts', value: conflicts.hasConflicts ? `⚠️ ${conflicts.conflictingFiles.length} files` : '✅ None', inline: true }
        );

      if (conflicts.hasConflicts) {
        embed.addFields({
          name: '⚠️ Conflicting Files',
          value: conflicts.conflictingFiles.slice(0, 10).join('\n') + 
                 (conflicts.conflictingFiles.length > 10 ? '\n...' : ''),
          inline: false
        });
        
        embed.addFields({
          name: '💡 Suggestions',
          value: conflicts.suggestions.slice(0, 3).join('\n'),
          inline: false
        });
      } else {
        embed.addFields({
          name: '🚀 Status',
          value: 'Ready for pull request! Use `/pr-ready` to create PR.',
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error checking branch status:', error);
      await interaction.editReply(`❌ Failed to check branch status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper methods
  private async getGitHubUsername(discordUserId: string): Promise<string> {
    // In a real implementation, this would look up the mapping from Discord ID to GitHub username
    // For now, we'll use a simplified approach
    return `github-user-${discordUserId.slice(-4)}`;
  }

  private generateBranchName(issue: any): string {
    const sanitizedTitle = issue.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
    
    return `feature/${issue.number}-${sanitizedTitle}`;
  }

  private async checkBranchExists(branchName: string): Promise<boolean> {
    try {
      await this.git.raw(['rev-parse', '--verify', branchName]);
      return true;
    } catch {
      return false;
    }
  }

  private async getBranchInfo(branchName: string) {
    try {
      const commitCount = await this.git.raw(['rev-list', '--count', branchName]);
      const lastCommit = await this.git.raw(['log', '-1', '--format=%cr', branchName]);
      
      return {
        commitCount: parseInt(commitCount.trim()),
        lastCommit: lastCommit.trim(),
      };
    } catch (error) {
      return {
        commitCount: 0,
        lastCommit: 'Unknown',
      };
    }
  }

  private async notifyTeamMembers(interaction: ChatInputCommandInteraction, message: string): Promise<void> {
    // In a real implementation, this would notify relevant team members
    // For now, we'll just log the notification
    console.log(`Team notification: ${message}`);
  }
}