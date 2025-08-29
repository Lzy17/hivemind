# 🚀 GitHub Integration - Team Vibe Coding Tools

Transform your Claude Code Spec Workflow into a powerful GitHub-based team collaboration platform. This integration bridges the gap between AI-driven specification creation and real-world team development workflows.

## 🎯 Overview

The GitHub integration extends the existing hivemind spec workflow with:
- **Automated GitHub Issues & PRs**: Convert specs into trackable GitHub issues
- **Smart Team Assignment**: AI-powered task assignment based on skills and workload
- **Real-time Progress Tracking**: Live dashboard with team metrics and velocity
- **Discord/Telegram Bots**: Team communication and workflow automation
- **Branch Management**: Automated feature branch creation and PR workflows

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Claude Code   │───▶│  GitHub Issues   │───▶│  Team Dashboard │
│  Spec Workflow  │    │  & Pull Requests │    │   & Analytics   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         ▼                        ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Task Generation │    │ Branch & PR      │    │ Discord/Telegram│
│ & Assignment    │    │ Automation       │    │ Bot Integration │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📋 Quick Start

### 1. Prerequisites

```bash
# Required environment variables
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export GITHUB_OWNER="your-org"  
export GITHUB_REPO="your-repo"

# Optional: Discord/Telegram integration
export DISCORD_TOKEN="your_discord_bot_token"
export TELEGRAM_TOKEN="your_telegram_bot_token"
```

### 2. Install Dependencies

```bash
# Install new GitHub integration dependencies
npm install @octokit/rest discord.js

# Or with the enhanced package.json
npm install
```

### 3. Enhanced Spec Creation

```bash
# Traditional spec workflow
/spec-create user-authentication "Secure user auth system"

# GitHub-enhanced workflow
/spec-create user-authentication "Secure user auth system" \
  --github-repo myorg/myapp \
  --team-members alice,bob,charlie \
  --github-integration
```

## 🎮 Core Features

### Automated GitHub Workflow

When you create a spec with `--github-integration`:

1. **Epic Issue Created**: Main tracking issue for the specification
2. **Task Issues Generated**: Individual GitHub issues for each atomic task
3. **Feature Branches**: Auto-created branches following naming convention
4. **Team Assignment**: Smart assignment based on skills and current workload
5. **Project Board**: Kanban board setup with automation rules
6. **PR Templates**: Standardized pull request templates

### Example Output

```markdown
## GitHub Workflow Created ✨

### Epic Issue  
- URL: https://github.com/myorg/myapp/issues/123
- Title: [EPIC] user-authentication
- Milestone: Sprint 24

### Task Issues
- Task 1.1: https://github.com/myorg/myapp/issues/124 → @alice
- Task 1.2: https://github.com/myorg/myapp/issues/125 → @bob  
- Task 1.3: https://github.com/myorg/myapp/issues/126 → @charlie

### Team Coordination
- Project Board: https://github.com/myorg/myapp/projects/5
- Alice: 3 tasks, estimated 12h (75% capacity)
- Bob: 2 tasks, estimated 8h (60% capacity) 
- Charlie: 2 tasks, estimated 10h (70% capacity)

### Next Steps for Team
1. `/issue-claim 124` - Claim tasks via Discord/Telegram
2. `/pr-ready feature/124-user-login` - Mark complete for PR
3. `/team-status` - View progress and workload
```

## 🤖 Discord Bot Commands

### Available Commands

```bash
# Claim GitHub issues
/issue-claim 124

# Mark feature ready for PR
/pr-ready feature/124-user-login

# Check team status
/team-status frontend-squad

# Assign issues manually  
/issue-assign 125 @bob

# Check branch status
/branch-status feature/124-user-login
```

### Example Discord Interaction

```
User: /issue-claim 124
Bot: ✅ Issue #124 Claimed Successfully
     📋 Issue: [Implement user login form](https://github.com/myorg/myapp/issues/124)
     🌿 Branch: feature/124-user-login-form
     👤 Assignee: @alice
     🚀 Next Steps:
     1. git checkout -b feature/124-user-login-form
     2. Start development work  
     3. Use /pr-ready feature/124-user-login-form when complete
```

## 📊 Team Dashboard

### Real-time Metrics

Access your enhanced dashboard at `http://localhost:8000` with new GitHub sections:

- **GitHub Issues Kanban**: Backlog → In Progress → Review → Done
- **Team Workload**: Real-time capacity and assignment distribution  
- **Velocity Charts**: Sprint performance and trend analysis
- **Code Quality Trends**: Technical debt and review metrics
- **PR Flow**: Pull request status and review assignments

### API Endpoints

```javascript
// Get GitHub data
GET /api/github/issues          // All open issues
GET /api/github/prs             // All open pull requests  
GET /api/github/kanban          // Kanban board data
GET /api/github/teams           // All teams

// Team metrics
GET /api/github/team/:teamId/metrics   // Team performance metrics
GET /api/github/team/:teamId/velocity  // Velocity trends

// Actions
POST /api/github/issues/:number/assign // Assign issue
POST /api/github/teams                 // Create team
```

## 🔄 Workflow Integration

### Spec-to-GitHub Flow

```mermaid
graph TD
    A[Create Spec] --> B[Analyze Tasks]
    B --> C[Create GitHub Issues]
    C --> D[Assign to Team]
    D --> E[Create Feature Branches]
    E --> F[Team Development]
    F --> G[PR Creation]
    G --> H[Code Review]
    H --> I[Merge & Deploy]
```

### Team Collaboration Flow

1. **Spec Creation**: Product owner creates specification with GitHub integration
2. **Automatic Setup**: Issues, branches, and team assignments created
3. **Team Notification**: Discord/Telegram alerts notify team members
4. **Issue Claiming**: Team members claim tasks via bot commands
5. **Development**: Work proceeds on feature branches
6. **PR Ready**: Developers mark features complete via bot
7. **Auto PR Creation**: System creates pull requests with proper reviewers
8. **Review & Merge**: Standard GitHub review process with notifications

## 🏗️ Team Management

### Creating Teams

```bash
# Create a new team
/team-create frontend-squad mycompany alice,bob,charlie

# Add team members
/team-add-member team_123 david lead

# Assign specs to teams
/team-assign-spec user-authentication frontend-squad --auto-distribute
```

### Smart Assignment Algorithm

The system considers:
- **Technical Skills**: Language and framework expertise
- **Domain Knowledge**: Previous work in related areas
- **Current Workload**: Open issues and PRs
- **Velocity**: Historical completion rates
- **Availability**: Working hours and time zones

## 🔧 Configuration

### Dashboard Configuration

```typescript
// Start dashboard with GitHub integration
const server = new MultiProjectDashboardServer({
  port: 8000,
  githubToken: process.env.GITHUB_TOKEN,
  githubOwner: 'myorg',
  githubRepo: 'myapp',
  tunnel: true, // Enable for team access
});
```

### Webhook Setup

Configure GitHub webhooks to point to your dashboard:

```bash
# Webhook URL (when using tunnel)
https://your-tunnel-domain.com/api/github/webhooks

# Events to subscribe to:
- push
- pull_request  
- issues
- pull_request_review
```

## 🚀 Advanced Features

### Branch Management

- **Naming Convention**: `feature/{issue-number}-{description}`
- **Auto-creation**: Branches created when issues are claimed
- **Branch Protection**: Automatic protection rules for main branches
- **Auto-cleanup**: Branches deleted after successful merge

### PR Automation

- **Template Generation**: Standardized PR descriptions and checklists
- **Reviewer Assignment**: Based on CODEOWNERS and expertise
- **Status Checks**: Integration with CI/CD pipelines
- **Auto-merge**: Optional auto-merge when all checks pass

### Analytics & Reporting

- **Velocity Tracking**: Sprint-over-sprint performance metrics
- **Workload Distribution**: Team capacity and assignment balance
- **Code Quality**: Technical debt and review quality trends
- **Predictive Analytics**: Sprint completion probability

## 🛠️ Troubleshooting

### Common Issues

**GitHub API Rate Limits**
```bash
# Check rate limit status
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/rate_limit
```

**Webhook Delivery Issues**
- Verify tunnel is active and accessible
- Check webhook payload format
- Review GitHub webhook delivery logs

**Permission Errors**
- Ensure GitHub token has proper scopes: `repo`, `read:org`, `write:repo_hook`
- Verify team members have repository access
- Check Discord bot permissions for channel access

### Debug Mode

```bash
# Enable debug logging
export CLAUDE_SPEC_DEBUG=true
export GITHUB_DEBUG=true

# Start dashboard with verbose logging
npm run dev:dashboard
```

## 📈 Performance Optimization

### Caching Strategy
- **Skill Profiles**: Cached for 24 hours
- **Workload Metrics**: Cached for 1 hour  
- **GitHub API**: Intelligent caching with ETags
- **Dashboard Data**: Real-time updates via WebSockets

### Scaling Considerations
- **Database**: Consider persistent storage for large teams
- **API Rate Limits**: Implement request queuing and batching
- **Webhook Processing**: Use background job queues for high volume
- **Multiple Repositories**: Support for multi-repo organizations

## 🔐 Security

### Token Management
- Use GitHub App tokens instead of personal access tokens
- Implement token rotation for long-running deployments
- Scope tokens to minimum required permissions

### Webhook Security
- Verify webhook signatures using secret
- Implement IP allowlisting for GitHub webhooks
- Use HTTPS for all webhook endpoints

## 🚀 Future Roadmap

- **Multi-repository Support**: Manage specs across multiple repositories
- **Jira Integration**: Sync with existing project management tools
- **Mobile Dashboard**: React Native app for team leads
- **AI-powered Code Review**: Automated code quality suggestions
- **Time Tracking**: Integration with time tracking tools
- **Custom Workflows**: User-defined automation rules

---

## 🤝 Contributing

See our [contribution guidelines](CONTRIBUTING.md) for details on:
- Code style and conventions
- Testing requirements
- Pull request process
- Issue reporting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

🤖 **Generated with [Claude Code Spec Workflow](https://github.com/pimzino/claude-code-spec-workflow)**

Co-Authored-By: Claude <noreply@anthropic.com>