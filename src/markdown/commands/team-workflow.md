# Team Workflow Management

Advanced team collaboration commands for GitHub-integrated spec workflows. Manages team coordination, task assignment, and progress tracking across distributed development teams.

## Available Commands

### `/team-create`
Create a new development team with GitHub integration.

```bash
/team-create <team-name> <github-org> [members...]
```

**Parameters:**
- `team-name`: Unique identifier for the team
- `github-org`: GitHub organization name
- `members`: Comma-separated list of GitHub usernames

**Example:**
```bash
/team-create frontend-squad mycompany alice,bob,charlie
```

### `/team-add-member`
Add a new member to an existing team.

```bash
/team-add-member <team-id> <github-username> [role]
```

**Parameters:**
- `team-id`: Team identifier
- `github-username`: GitHub username to add
- `role`: member | lead | admin (default: member)

### `/team-assign-spec`
Assign a specification to a team with automatic task distribution.

```bash
/team-assign-spec <spec-name> <team-id> [--auto-distribute]
```

**Process:**
1. Analyze spec tasks and complexity
2. Match tasks to team member skills
3. Balance workload across team members
4. Create GitHub issues and assignments
5. Set up project board and milestones

### `/team-status`
Display comprehensive team status and metrics.

```bash
/team-status [team-id] [--detailed]
```

**Output includes:**
- Current workload distribution
- Active issues and PRs per member
- Velocity metrics and trends
- Capacity analysis
- Upcoming deadlines

### `/team-standup`
Generate daily standup summary for team.

```bash
/team-standup <team-id> [--since yesterday]
```

**Generates:**
- Completed work since last standup
- Work in progress
- Blockers and dependencies
- Planned work for today

## GitHub Integration Features

### Automatic Issue Assignment
- **Skill-based matching**: Assigns tasks based on member expertise
- **Workload balancing**: Distributes work evenly across team
- **Capacity awareness**: Considers current workload and availability

### Progress Tracking
- **Real-time updates**: GitHub webhooks provide instant progress updates
- **Velocity metrics**: Track team performance over time
- **Burndown charts**: Visualize sprint progress

### Code Review Orchestration
- **Smart reviewer assignment**: Based on code ownership and expertise
- **Review workload balancing**: Distributes review requests evenly
- **Escalation handling**: Auto-escalate stale reviews

## Team Workflow Templates

### Spec-Driven Development Flow
```markdown
1. **Spec Creation**: Product owner creates specification
2. **Team Assignment**: `/team-assign-spec user-auth frontend-squad`
3. **Task Distribution**: Automatic skill-based task assignment
4. **Development**: Team members work on assigned tasks
5. **Progress Tracking**: Real-time updates via GitHub integration
6. **Code Review**: Automated reviewer assignment
7. **Integration**: CI/CD pipeline handles deployment
8. **Retrospective**: Velocity analysis and improvement suggestions
```

### Bug Triage Workflow
```markdown
1. **Bug Report**: Automated issue creation from monitoring
2. **Severity Assessment**: AI-powered severity classification
3. **Team Assignment**: Route to appropriate team based on component
4. **Priority Queuing**: Integrate with existing sprint planning
5. **Resolution Tracking**: Monitor time-to-resolution metrics
6. **Knowledge Sharing**: Auto-generate resolution documentation
```

## Advanced Team Commands

### `/team-velocity`
Analyze team velocity trends and performance metrics.

```bash
/team-velocity <team-id> [--period 30d] [--format chart|json]
```

### `/team-capacity`
View and manage team capacity planning.

```bash
/team-capacity <team-id> [--next-sprint] [--vacation-aware]
```

### `/team-skills`
Analyze and update team skill profiles.

```bash
/team-skills <team-id> [--update] [--recommend-training]
```

### `/team-dependencies`
Track and manage cross-team dependencies.

```bash
/team-dependencies <team-id> [--blocking|blocked-by]
```

## Integration with Communication Tools

### Discord Integration
- Real-time notifications for issue assignments
- Daily standup summaries in team channels
- Progress celebrations and milestone achievements
- Escalation alerts for blocked work

### Slack Integration
- Automated status updates in project channels
- Custom workflows for approval processes
- Integration with existing Slack workflows
- Thread-based discussion on specific issues

## Metrics and Analytics

### Team Health Metrics
- **Velocity consistency**: Track sprint-over-sprint performance
- **Work distribution**: Ensure balanced workload across members
- **Collaboration index**: Measure cross-team collaboration
- **Knowledge sharing**: Track documentation and mentoring activities

### Predictive Analytics
- **Sprint completion probability**: AI-powered sprint success prediction
- **Risk assessment**: Identify potential blockers and delays
- **Capacity forecasting**: Predict team capacity for future sprints
- **Skill gap analysis**: Identify training and hiring needs

## Configuration and Setup

### Environment Variables
```env
GITHUB_TOKEN=your_github_token
GITHUB_ORG=your_organization
DISCORD_TOKEN=your_discord_token
SLACK_TOKEN=your_slack_token
```

### Team Configuration File
```json
{
  "team": {
    "name": "frontend-squad",
    "githubOrg": "mycompany",
    "defaultReviewers": 2,
    "workingHours": {
      "timezone": "UTC-8",
      "start": "09:00",
      "end": "17:00"
    },
    "skills": {
      "required": ["javascript", "react"],
      "preferred": ["typescript", "testing"]
    }
  }
}
```

## Best Practices

### Team Structure
1. **Keep teams small**: 3-7 developers for optimal communication
2. **Cross-functional**: Include frontend, backend, and testing skills
3. **Clear ownership**: Each team owns specific product areas
4. **Rotating responsibilities**: Share leadership and review duties

### Workflow Optimization
1. **Atomic tasks**: Keep tasks small and independently deployable
2. **Clear acceptance criteria**: Every task has defined completion criteria
3. **Regular retrospectives**: Weekly team improvement discussions
4. **Continuous learning**: Encourage skill development and knowledge sharing

### Communication Guidelines
1. **Async-first**: Design workflows for distributed teams
2. **Status transparency**: Make progress visible to entire team
3. **Escalation paths**: Clear procedures for handling blockers
4. **Documentation culture**: Document decisions and tribal knowledge

---

## Error Handling

Common issues and their resolutions:

**Team member not found**: Verify GitHub username and organization access
**Permission denied**: Check GitHub token scopes and repository permissions
**Rate limit exceeded**: Implement exponential backoff and request queuing
**Webhook delivery failed**: Verify tunnel configuration and endpoint accessibility

---

🤖 **Generated with [Claude Code Spec Workflow](https://github.com/pimzino/claude-code-spec-workflow)**

Co-Authored-By: Claude <noreply@anthropic.com>