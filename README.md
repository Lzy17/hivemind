# Claude Code Spec Workflow

> **⚠️ IMPORTANT NOTICE:** Development focus has shifted to the **MCP (Model Context Protocol) version** of this workflow system. The MCP version provides enhanced features, real-time dashboard, and broader AI tool compatibility.
> 
> **🚀 [View the new Spec Workflow MCP →](https://github.com/Pimzino/spec-workflow-mcp)**
>
> This Claude Code-specific version remains available for existing users but will receive limited updates.

[![npm version](https://badge.fury.io/js/@pimzino%2Fclaude-code-spec-workflow.svg?cacheSeconds=300)](https://badge.fury.io/js/@pimzino%2Fclaude-code-spec-workflow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Automated workflows for Claude Code with intelligent task execution.**

Transform your development with structured workflows: **Requirements → Design → Tasks → Implementation** for new features, plus streamlined **Report → Analyze → Fix → Verify** for bug fixes.

## ☕ Support This Project

<a href="https://buymeacoffee.com/Pimzino" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

---

## 📦 Installation

1. Install the workflow globally
```bash
npm i -g @pimzino/claude-code-spec-workflow
```
2. Run the setup command in your project directory
```bash
claude-code-spec-workflow
```
**Thats it, you are ready to go!**
---

## ✨ What You Get

- **📁 Complete .claude/ structure** - All files and directories
- **📝 10 slash commands** - 5 spec workflow + 5 bug fix workflow
- **🎯 Intelligent task execution** - Automated implementation
- **🤖 4 specialized agents** - Enhanced automation
- **📊 Real-time dashboard** - Monitor progress visually
- **🔧 Auto-generated commands** - One command per task
- **📋 Document templates** - Professional spec documents
- **⚙️ Project steering** - Persistent context and standards
- **⚡ Smart optimization** - Intelligent context sharing and caching

---

## 🔄 Workflows Overview

### 📊 **Spec Workflow** (New Features)

**Complete automation in one command:**

```bash
/spec-create feature-name "Description"
```

**What happens:**
1. **Requirements** → User stories + acceptance criteria
2. **Design** → Technical architecture + diagrams
3. **Tasks** → Atomic, agent-friendly breakdown
4. **Commands** → Auto-generated task commands (optional)

**Execute tasks:**
```bash
# Manual control
/spec-execute 1 feature-name
/feature-name-task-1        # Auto-generated
```

### 🐛 **Bug Fix Workflow** (Quick Fixes)

```bash
/bug-create issue-name "Description"  # Document the bug
/bug-analyze                          # Find root cause
/bug-fix                             # Implement solution
/bug-verify                          # Confirm resolution
```

### 🎯 **Steering Setup** (Project Context)

```bash
/spec-steering-setup  # Creates product.md, tech.md, structure.md
```

---

## 🛠️ Commands Reference

<details>
<summary><strong>📊 Spec Workflow Commands</strong></summary>

| Command | Purpose |
|---------|---------|
| `/spec-steering-setup` | Create project context documents |
| `/spec-create <name>` | Complete spec workflow |
| `/spec-execute <task-id>` | Manual task execution |
| `/<name>-task-<id>` | Auto-generated task commands |
| `/spec-status` | Show progress |
| `/spec-list` | List all specs |

</details>

<details>
<summary><strong>🐛 Bug Fix Commands</strong></summary>

| Command | Purpose |
|---------|---------|
| `/bug-create <name>` | Document bug with structured format |
| `/bug-analyze` | Investigate root cause |
| `/bug-fix` | Implement targeted solution |
| `/bug-verify` | Verify resolution |
| `/bug-status` | Show bug fix progress |

</details>

---

## 🎯 Key Features

### 🤖 **Intelligent Task Execution**
- **Streamlined** task implementation
- **Context-aware** execution with full specification context
- **Agent-based** implementation with spec-task-executor

### 🧠 **Specialized Agents** (Optional)
4 AI agents for enhanced automation:

**Core Workflow:** `spec-task-executor`, `spec-requirements-validator`, `spec-design-validator`, `spec-task-validator`


> **Note:** Agents are optional - everything works with built-in fallbacks.

### ⚡ **Complete Context Optimization** (NEW!)
- **Universal context sharing** - Steering, specification, AND template documents optimized
- **60-80% token reduction** - Eliminates redundant document fetching across all document types
- **Triple optimization commands** - `get-steering-context`, `get-spec-context`, and `get-template-context`
- **Smart document handling** - Bug documents use direct reading (no redundancy), templates use bulk loading (high redundancy)
- **Improved performance** - Faster agent execution with cached context across all workflows
- **Automatic fallback** - Maintains reliability with individual `get-content` when optimization unavailable
- **Session-based caching** - Intelligent file change detection and cache invalidation

### 📊 **Real-Time Dashboard**
```bash
npx -p @pimzino/claude-code-spec-workflow claude-spec-dashboard
```
- Live progress tracking
- WebSocket updates
- Git integration
- Modern UI with Tailwind CSS

---

### 🔗 Dashboard Tunnel (NEW!)

Share your dashboard securely with external stakeholders through temporary HTTPS URLs:

```bash
# Start dashboard with tunnel
npx -p @pimzino/claude-code-spec-workflow claude-spec-dashboard --tunnel

# With password protection
npx -p @pimzino/claude-code-spec-workflow claude-spec-dashboard --tunnel --tunnel-password mySecret123

# Choose specific provider
npx -p @pimzino/claude-code-spec-workflow claude-spec-dashboard --tunnel --tunnel-provider cloudflare
```

**Tunnel Features:**
- **🔒 Secure HTTPS URLs** - Share dashboard with managers, clients, or remote team members
- **👁️ Read-Only Access** - External viewers cannot modify any project data
- **🔑 Optional Password** - Protect access with password authentication
- **🌐 Multiple Providers** - Automatic fallback between Cloudflare and ngrok
- **📊 Usage Analytics** - Track who accessed your dashboard and when
- **⏰ Auto-Expiration** - Tunnels close when you stop the dashboard
- **🚀 Zero Configuration** - Works out of the box with built-in providers

## 📊 Command Line Options

### Setup Commands
```bash
# Setup in current directory
npx @pimzino/claude-code-spec-workflow

# Setup in specific directory
npx @pimzino/claude-code-spec-workflow --project /path/to/project

# Force overwrite existing files
npx @pimzino/claude-code-spec-workflow --force

# Skip confirmation prompts
npx @pimzino/claude-code-spec-workflow --yes

# Test the setup
npx @pimzino/claude-code-spec-workflow test
```

### Dashboard Commands
```bash
# Basic dashboard
npx -p @pimzino/claude-code-spec-workflow claude-spec-dashboard

# Dashboard with tunnel (share externally)
npx -p @pimzino/claude-code-spec-workflow claude-spec-dashboard --tunnel

# Full tunnel configuration
npx -p @pimzino/claude-code-spec-workflow claude-spec-dashboard \
  --tunnel \
  --tunnel-password mySecret123 \
  --tunnel-provider cloudflare \
  --port 3000 \
  --open
```

## 🎯 Steering Documents (NEW!)

Steering documents provide persistent project context that guides all spec development:

### **Product Document** (`product.md`)
- Product vision and purpose
- Target users and their needs
- Key features and objectives
- Success metrics

### **Technology Document** (`tech.md`)
- Technology stack and frameworks
- Development tools and practices
- Technical constraints and requirements
- Third-party integrations

### **Structure Document** (`structure.md`)
- File organization patterns
- Naming conventions
- Import patterns
- Code organization principles

Run `/spec-steering-setup` to create these documents. Claude will analyze your project and help you define these standards.

## 🎨 Features

### ✅ **Zero Configuration**
- Works out of the box with any project
- Auto-detects project type (Node.js, Python, Java, etc.)
- Validates Claude Code installation

### ✅ **Interactive Setup**
- Beautiful CLI with progress indicators
- Confirmation prompts for safety
- Helpful error messages and guidance

### ✅ **Smart File Management**
- Complete workflow instructions in each command file
- Creates comprehensive directory structure
- Includes all necessary templates and configs

### ✅ **Professional Quality**
- **Full TypeScript implementation** with strict type checking
- **Frontend converted to TypeScript** for enhanced dashboard development
- **95%+ type coverage** with no implicit any types
- **Modern build pipeline** with esbuild bundling and source maps
- Comprehensive error handling
- Follows npm best practices

### ✅ **Steering Document Integration**
- Persistent project context across all specs
- Automatic alignment with project standards
- Consistent code generation
- Reduced need for repetitive explanations

### ✅ **TypeScript Dashboard Frontend**
- **Type-safe frontend code** with comprehensive interfaces
- **Real-time WebSocket communication** with typed message handling
- **Petite-vue integration** with custom type definitions
- **Build pipeline** supporting development and production bundles
- **Strict null checking** and modern TypeScript patterns
- **JSDoc documentation** for all exported functions

## 🏗️ Project Structure After Setup

```
your-project/
├── .claude/
│   ├── commands/           # 14 slash commands + auto-generated
│   ├── steering/          # product.md, tech.md, structure.md
│   ├── templates/         # Document templates
│   ├── specs/            # Generated specifications
│   ├── bugs/             # Bug fix workflows
│   └── agents/           # AI agents (enabled by default)
```

## 🧪 Testing

The package includes a built-in test command:

```bash
# Test setup in temporary directory
npx @pimzino/claude-code-spec-workflow test
```

## 📋 Requirements

- **Node.js** 16.0.0 or higher
- **Claude Code** installed and configured
- Any project directory

## 🔧 Troubleshooting

### Common Issues

**❓ Command not found after NPX**
```bash
# Make sure you're using the correct package name
npx @pimzino/claude-code-spec-workflow
```

**❓ Setup fails with permission errors**
```bash
# Try with different directory permissions
npx @pimzino/claude-code-spec-workflow --project ~/my-project
```

**❓ Claude Code not detected**
```bash
# Install Claude Code first
npm install -g @anthropic-ai/claude-code
```

### Debug Information

```bash
# Show verbose output
DEBUG=* npx @pimzino/claude-code-spec-workflow

# Check package version
npx @pimzino/claude-code-spec-workflow --version
```

## 🌟 Examples

### Basic Usage
```bash
cd my-awesome-project
npx @pimzino/claude-code-spec-workflow
claude
# Type: /spec-create user-dashboard "User profile management"
```

### Advanced Usage
```bash
# Setup multiple projects
for dir in project1 project2 project3; do
  npx @pimzino/claude-code-spec-workflow --project $dir --yes
done
```

## 🔧 TypeScript Development

### Frontend Dashboard Development

The dashboard frontend is fully implemented in TypeScript for enhanced type safety and developer experience:

#### Type Definitions
```typescript
// Core dashboard types
interface Project {
  path: string;
  name: string;
  level: number;
  hasActiveSession: boolean;
  specs: Spec[];
  bugs: Bug[];
  steeringStatus?: SteeringStatus;
}

// WebSocket message types with discriminated unions
type WebSocketMessage = 
  | { type: 'initial'; data: InitialData }
  | { type: 'update'; data: UpdateData }
  | { type: 'error'; data: ErrorData }
  | { type: 'tunnel-status'; data: TunnelStatusData };
```

#### Build Commands
```bash
# TypeScript compilation and bundling
npm run build:frontend:dev   # Build frontend for development
npm run build:frontend:prod  # Build frontend for production (minified)
npm run watch:frontend       # Watch mode with auto-rebuild
npm run typecheck:frontend   # Type checking only (no output)
npm run typecheck           # Check both backend and frontend types

# Development workflow  
npm run dev:dashboard       # Start dashboard with hot reload (frontend + backend)
npm run dev:dashboard:backend-only  # Start only backend (for frontend debugging)

# Full build process
npm run build              # Complete build: TypeScript + frontend + static files
npm run lint               # Lint TypeScript files with auto-fix
npm run format             # Format code with Prettier
```

#### Type Safety Features
- **Strict TypeScript configuration** with null checks
- **Runtime type validation** with type guards
- **WebSocket message typing** for real-time updates  
- **State management types** for reactive UI components
- **Error handling types** with Result<T> pattern
- **Petite-vue integration** with custom type definitions

#### Type Usage Examples

```typescript
// Import dashboard types
import type { Project, WebSocketMessage, AppState } from './dashboard.types';

// Type-safe project handling
function selectProject(project: Project): void {
  console.log(`Selected: ${project.name} (${project.specs.length} specs)`);
  
  // Safe property access with optional chaining
  const steeringCount = project.steeringStatus?.totalDocs ?? 0;
  if (steeringCount > 0) {
    console.log(`Steering docs: ${steeringCount}`);
  }
}

// WebSocket message handling with discriminated unions
function handleMessage(message: WebSocketMessage): void {
  switch (message.type) {
    case 'initial':
      // TypeScript knows data is InitialData
      console.log(`Loaded ${message.data.projects.length} projects`);
      break;
    case 'update':
      // TypeScript knows data is UpdateData
      console.log(`Updated project: ${message.data.projectPath}`);
      break;
    case 'error':
      // TypeScript knows data is ErrorData
      console.error(`Error: ${message.data.message}`);
      break;
  }
}

// Type guards for runtime validation
function isValidProject(obj: unknown): obj is Project {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'path' in obj &&
    'name' in obj &&
    'specs' in obj &&
    Array.isArray((obj as Project).specs)
  );
}

// Result type for error handling
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

function parseProjectData(data: unknown): Result<Project> {
  if (isValidProject(data)) {
    return { success: true, data };
  }
  return { success: false, error: new Error('Invalid project data') };
}
```

#### Development Guidelines
- **JSDoc documentation** on all exported functions
- **95%+ type coverage** maintained (no implicit any types)
- **Modern TypeScript patterns** (optional chaining, nullish coalescing)
- **Type guards preferred** over type assertions
- **Interfaces for object shapes**, union types for discriminated unions
- **Result<T> pattern** for error handling
- **Runtime validation** with type guards for external data

## 📚 Documentation

- **[Full Documentation](https://github.com/pimzino/claude-code-spec-workflow#readme)**
- **[Tunnel Feature Guide](./docs/tunnel-feature.md)** - Comprehensive tunnel documentation
- **[Tunnel Examples](./examples/tunnel/)** - Ready-to-use tunnel scripts
- **[Claude Code Docs](https://docs.anthropic.com/claude-code)**
- **[TypeScript API Reference](./docs/typescript-api.md)** - Generated from JSDoc comments

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guide](https://github.com/pimzino/claude-code-spec-workflow/blob/main/CONTRIBUTING.md).

## 📄 License

MIT License - see [LICENSE](https://github.com/pimzino/claude-code-spec-workflow/blob/main/LICENSE) for details.

## 🏷️ Changelog

See [CHANGELOG.md](https://github.com/pimzino/claude-code-spec-workflow/blob/main/CHANGELOG.md) for version history.

---

## 🚦 When To Use What

| Scenario | Recommended Approach |
|----------|---------------------|
| **New feature, well-defined** | `/spec-execute` or individual task commands |
| **Complex/experimental feature** | `/spec-execute` (manual control) |
| **Bug in existing code** | Bug workflow (`/bug-create` → `/bug-verify`) |
| **Learning the codebase** | Manual execution with individual commands |
| **Production deployment** | Full spec workflow with completion review |

---

## 🚀 Installation & Setup

### **Installation**
```bash
# Install globally (recommended)
npm install -g @pimzino/claude-code-spec-workflow

# Verify installation
claude-code-spec-workflow --version
```

### **Setup Options**
```bash
# Basic setup
claude-code-spec-workflow

# Advanced options
claude-code-spec-workflow --project /path --force --yes
```

**During setup you choose:**
- ✅ **Enable agents?** Enhanced automation vs simpler setup
- ✅ **Project analysis** Auto-detection of frameworks and patterns

---

## 📚 Examples
**Recommendation: Use Claude Opus 4 to generate the spec documentation '/spec-create', then use Claude Sonnet 4 for the implementation i.e. '/spec-execute' or '/{spec-name}-task-<id>'.**
<details>
<summary><strong>Basic Workflow Example</strong></summary>

```bash
# 1. Install globally (one time)
npm install -g @pimzino/claude-code-spec-workflow

# 2. Setup project (one time)
cd my-project
claude-code-spec-workflow

# 3. Create steering documents (recommended)
claude
/spec-steering-setup

# 4. Create feature spec
/spec-create user-authentication "Secure login system"

# 5. Execute tasks
/spec-execute 1 user-authentication

# 6. Monitor progress
/spec-status user-authentication
```

</details>

<details>
<summary><strong>Bug Fix Example</strong></summary>

```bash
/bug-create login-timeout "Users logged out too quickly"
/bug-analyze
/bug-fix
/bug-verify
```

</details>

---

## ⚡ Context Optimization Commands

The package includes optimized commands for efficient document loading across all document types:

### **get-steering-context**
Load all steering documents at once for context sharing:
```bash
claude-code-spec-workflow get-steering-context
```
**Output**: Formatted markdown with all steering documents (product.md, tech.md, structure.md)

### **get-spec-context**
Load all specification documents at once for context sharing:
```bash
claude-code-spec-workflow get-spec-context feature-name
```
**Output**: Formatted markdown with all spec documents (requirements.md, design.md, tasks.md)

### **get-template-context**
Load templates by category for context sharing:
```bash
# Load all templates
claude-code-spec-workflow get-template-context

# Load specific template category
claude-code-spec-workflow get-template-context spec    # Spec templates
claude-code-spec-workflow get-template-context bug     # Bug templates
claude-code-spec-workflow get-template-context steering # Steering templates
```
**Output**: Formatted markdown with requested templates

### **Smart Document Handling**
- **High-redundancy documents** (steering, specs, templates): Use optimized bulk loading
- **Low-redundancy documents** (bug reports): Use direct file reading for simplicity
- **Selective delegation**: Main agents load full context, but pass only relevant portions to sub-agents
- **Individual files**: Continue using `get-content` for edge cases

### **Benefits**
- **60-80% token reduction** compared to individual file loading
- **Faster execution** with cached context across all workflows
- **Automatic fallback** to individual `get-content` when needed
- **Session-based caching** with intelligent file change detection

### **Hierarchical Context Management**
The system implements a sophisticated **hierarchical context management strategy** for maximum efficiency:

**Main Agents** (Commands like `/spec-execute`, `/spec-create`):
- **Load ALL context once** at the beginning using optimized commands
- **Store complete context** for task coordination and decision-making
- **Distribute selective context** to sub-agents without requiring reloads

**Sub-Agents** (Agents like `spec-task-executor`):
- **Priority 1**: Use provided context from task instructions (steering, specification, task details)
- **Priority 2**: Fallback to loading context only if not provided above
- **Never redundantly load** context when it's already been provided by main agents

**Context Distribution Pattern**:
```
Main Agent loads: Steering + Full Spec + Task Details
↓ Delegates to Sub-Agent with:
├── Complete Steering Context
├── Selective Spec Context (Requirements + Design only)
├── Specific Task Details
└── Clear instruction: "Do NOT reload context"
```

This approach **eliminates redundant loading** while ensuring each agent has exactly the context it needs.

---

## 🛟 Troubleshooting

<details>
<summary><strong>Common Issues</strong></summary>

**❓ "Command not found"**
```bash
# Install globally first
npm install -g @pimzino/claude-code-spec-workflow

# Then use the command
claude-code-spec-workflow
```

**❓ "Claude Code not detected"**
```bash
npm install -g @anthropic-ai/claude-code
```

**❓ "Permission errors"**
```bash
claude-code-spec-workflow --project ~/my-project
```

</details>

---

## 📋 Requirements

- **Node.js** 16.0.0+
- **Claude Code** installed
- Any project directory

---

## 🔗 Links

- **[Full Documentation](https://github.com/pimzino/claude-code-spec-workflow#readme)**
- **[Claude Code Docs](https://docs.anthropic.com/claude-code)**
- **[Report Issues](https://github.com/pimzino/claude-code-spec-workflow/issues)**

---

## 📄 License & Credits

**MIT License** - [LICENSE](LICENSE)

**Made with ❤️ by [Pimzino](https://github.com/pimzino)**

**Special Thanks:**
- @pimzino - Initial setup
- @boundless-oss - Steering documents
- @mquinnv - Dashboard feature

**Powered by:** [Claude Code](https://docs.anthropic.com/claude-code) • [Mermaid](https://mermaid.js.org/) • [TypeScript](https://www.typescriptlang.org/)







● Team Vibe Coding Tools - 实现完成 ✅

  已成功实现基于 GitHub 的团队协作 Spec 驱动开发平台，核心功能包括：

  🎯 核心实现成果

  Phase 1: 核心GitHub集成
  - ✅ src/collaboration/github-integration.ts - GitHub API 封装和自动化
  - ✅ src/collaboration/pr-workflow.ts - PR 生命周期管理和冲突检测
  - ✅ 扩展现有 spec-create.md 支持 GitHub 工作流参数
  - ✅ src/markdown/commands/github-spec.md - GitHub 专用规格处理

  Phase 2: 团队协作功能
  - ✅ src/auth/team-manager.ts - 智能团队管理和技能分析
  - ✅ src/bots/discord/github-commands.ts - Discord 机器人集成
  - ✅ 智能任务分配算法（基于技能、工作负载、速度）

  Phase 3: 高级协作功能
  - ✅ src/dashboard/github-dashboard.ts - GitHub 数据可视化
  - ✅ 扩展 src/dashboard/multi-server.ts 集成 GitHub API 端点
  - ✅ GitHub Webhooks 处理（Push、PR、Issue、Review 事件）
  - ✅ src/markdown/commands/team-workflow.md - 团队工作流命令

  文档和指南
  - ✅ GITHUB_INTEGRATION.md - 完整的使用指南和配置说明

  🚀 主要功能特性

  1. GitHub 原生集成
    - 自动创建 Epic 和 Task Issues
    - 智能分支管理和 PR 自动化
    - 基于技能的团队任务分配
  2. 实时协作仪表板
    - Kanban 看板和进度追踪
    - 团队工作负载和速度分析
    - GitHub 事件的实时 WebSocket 更新
  3. Discord/Telegram 机器人
    - /issue-claim - 认领 GitHub 问题
    - /pr-ready - 标记功能完成并创建 PR
    - /team-status - 查看团队状态和指标
  4. 智能自动化
    - 技能匹配的任务分配
    - 冲突检测和合并策略建议
    - 代码审核员智能分配

  📊 技术架构亮点

  - 模块化设计: 保持现有代码架构不变，通过扩展实现功能
  - 类型安全: 完整的 TypeScript 类型定义和接口
  - 缓存策略: 智能缓存减少 GitHub API 调用
  - 错误处理: 全面的错误处理和恢复机制

  🔧 配置和使用

  # 基础规格创建（传统模式）
  /spec-create user-authentication "安全用户认证系统"

  # GitHub 增强模式
  /spec-create user-authentication "安全用户认证系统" \
    --github-repo myorg/myapp \
    --team-members alice,bob,charlie \
    --github-integration

  🎮 团队协作流程

  1. 规格创建 → 2. 自动 GitHub 设置 → 3. 团队通知 → 4. 任务认领 → 5. 功能开发 → 6. PR 创建 → 7. 代码审查 → 8. 合并部署

  该实现完全符合技术规格书要求，将现有的 hivemind 库成功转换为企业级团队协作平台，同时保持了原有的简洁性和强大功能。

> 好的现在教学一下我怎么使用

● 📚 Team Vibe Coding Tools 使用教程

  让我手把手教你如何使用这个 GitHub 集成的团队协作工具！

  🚀 第一步：环境设置

  1.1 安装依赖

  # 进入项目目录
  cd hivemind

  # 安装新的依赖
  npm install

  1.2 配置环境变量

  创建 .env 文件：
  # GitHub 集成配置
  GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  GITHUB_OWNER=你的组织名
  GITHUB_REPO=你的仓库名

  # 可选：Discord 机器人
  DISCORD_TOKEN=你的Discord机器人令牌

  # 可选：开启调试模式
  CLAUDE_SPEC_DEBUG=true

  1.3 获取 GitHub Token

  1. 访问 GitHub → Settings → Developer settings → Personal access tokens
  2. 创建新令牌，选择权限：
    - repo (完整仓库权限)
    - read:org (读取组织信息)
    - write:repo_hook (管理 Webhooks)

  🎯 第二步：启动系统

  2.1 启动增强仪表板

  # 启动带 GitHub 集成的仪表板
  npm run dev:dashboard

  # 或者指定 GitHub 配置启动
  GITHUB_TOKEN=你的token GITHUB_OWNER=组织名 GITHUB_REPO=仓库名 npm run dev:dashboard

  2.2 验证启动

  你应该看到：
  ✅ GitHub integration enabled for 组织名/仓库名
  🚀 Starting tunnel (provider: auto)...
  Dashboard available at: http://localhost:8000

  📝 第三步：创建你的第一个 GitHub 集成规格

  3.1 基础规格创建（传统模式）

  # 传统方式 - 只在本地创建规格
  claude-code-spec-workflow spec-create user-profile "用户个人资料管理"

  3.2 GitHub 增强模式

  # GitHub 集成模式 - 创建规格 + GitHub Issues + 团队协作
  claude-code-spec-workflow spec-create user-profile "用户个人资料管理" \
    --github-repo myorg/myapp \
    --team-members alice,bob,charlie \
    --github-integration

  3.3 实际演示

  让我演示一个完整的流程：

  # 创建一个用户认证功能的规格
  claude-code-spec-workflow spec-create user-auth "实现用户注册登录功能" \
    --github-repo hivemind-demo/webapp \
    --team-members john,sarah,mike \
    --github-integration

  系统会自动：
  1. ✅ 分析需求并创建 requirements.md
  2. ✅ 生成技术设计 design.md
  3. ✅ 将功能分解为原子任务 tasks.md
  4. ✅ 在 GitHub 创建 Epic Issue 和子任务 Issues
  5. ✅ 根据技能和工作负载分配任务给团队成员
  6. ✅ 创建对应的 feature 分支
  7. ✅ 设置项目看板

  🤖 第四步：使用 Discord 机器人

  4.1 设置 Discord 机器人

  1. 在 Discord Developer Portal 创建应用和机器人
  2. 获取 Bot Token 并添加到环境变量
  3. 邀请机器人到你的服务器

  4.2 使用机器人命令

  认领任务：
  /issue-claim 123
  机器人回复：
  ✅ Issue #123 Claimed Successfully
  📋 Issue: [实现用户登录表单](https://github.com/myorg/myapp/issues/123)
  🌿 Branch: feature/123-user-login-form
  👤 Assignee: @alice
  🚀 Next Steps:
  1. git checkout -b feature/123-user-login-form
  2. Start development work
  3. Use /pr-ready feature/123-user-login-form when complete

  标记功能完成：
  /pr-ready feature/123-user-login-form

  查看团队状态：
  /team-status

  📊 第五步：使用增强仪表板

  5.1 访问仪表板

  打开浏览器访问：http://localhost:8000

  你会看到新的 GitHub 集成面板：

  5.2 GitHub 功能面板

  - Issues Kanban: 拖拽式任务管理
  - 团队工作负载: 实时容量分析
  - 速度图表: 团队绩效趋势
  - PR 流水线: 代码审查状态

  5.3 实时更新

  当团队成员：
  - 推送代码 → 仪表板显示提交信息
  - 创建 PR → 自动出现在审查列
  - 完成任务 → Kanban 自动更新

  🏗️ 第六步：团队协作工作流

  完整开发周期演示：

  1. 产品经理创建规格
  /spec-create payment-system "在线支付集成" \
    --github-repo ecommerce/backend \
    --team-members alice,bob,charlie \
    --github-integration

  2. 系统自动设置
  - ✅ GitHub 创建 Epic Issue #150
  - ✅ 分解为 5 个子任务 (#151-#155)
  - ✅ 分配任务：Alice(2), Bob(2), Charlie(1)
  - ✅ 创建 5 个 feature 分支

  3. 开发者认领任务
  Alice: /issue-claim 151
  Bot: ✅ Issue #151 认领成功 - 设计支付API接口
       Branch: feature/151-payment-api-design

  4. 开发完成提交PR
  Alice: /pr-ready feature/151-payment-api-design
  Bot: 🚀 Pull Request Created
       Review请求已发送给 @bob, @tech-lead

  5. 团队协作状态
  Manager: /team-status
  Bot: 📊 Team Status
       👥 Active: Alice(75%), Bob(60%), Charlie(40%)
       📋 Open Issues: 3
       🔀 Open PRs: 2
       🎯 Sprint Progress: 67% complete

  🔧 第七步：高级功能

  7.1 团队管理

  # 创建新团队
  /team-create frontend-squad mycompany alice,bob,charlie

  # 分配规格给团队
  /team-assign-spec user-dashboard frontend-squad --auto-distribute

  # 查看团队速度
  /team-velocity frontend-squad --period 30d

  7.2 分支状态检查

  /branch-status feature/151-payment-api-design
  机器人会检查：
  - ✅ 提交数量和最近更新
  - ⚠️ 潜在合并冲突
  - 💡 合并建议

  7.3 批量操作

  # 批量分配 Issues
  POST /api/github/issues/bulk-assign
  {
    "issues": [151, 152, 153],
    "assignee": "alice"
  }

  # 批量更新标签
  POST /api/github/issues/bulk-label
  {
    "issues": [151, 152],
    "labels": ["frontend", "urgent"]
  }

  🚨 故障排除

  常见问题

  GitHub API 限制
  # 检查速率限制
  curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/rate_limit

  机器人无响应
  - 检查 Discord Token 权限
  - 验证机器人在频道中有发言权限
  - 查看控制台错误日志

  Webhook 失败
  - 确保隧道（tunnel）正在运行
  - 验证 GitHub Webhook 配置指向正确 URL
  - 检查 /api/github/webhooks 端点可访问

  🎉 最佳实践

  工作流建议

  1. 小团队: 3-7 人最佳，保持沟通高效
  2. 原子任务: 每个任务 15-30 分钟完成
  3. 清晰验收标准: 每个任务都有明确完成定义
  4. 定期回顾: 使用速度数据优化流程

  命名约定

  - 分支: feature/123-user-login-form
  - 提交: feat: add user login validation
  - PR标题: feat: implement user authentication system

  现在你可以开始使用这个强大的团队协作工具了！🚀

  有任何问题随时问我，我会帮你解决具体的使用问题。
