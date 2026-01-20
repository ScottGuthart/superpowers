# Superpowers for pi coding agent

Complete guide for using superpowers with the [pi coding agent](https://github.com/badlogic/pi-mono).

## Overview

Superpowers provides a skills-based extension system for pi coding agent, delivering proven workflows, processes, and techniques directly to your AI coding sessions. The pi extension system allows for deep integration through custom tools, commands, and lifecycle event handlers.

## Quick Start

### Automated Installation

Run the setup script for automatic installation:

```bash
curl -fsSL https://raw.githubusercontent.com/obra/superpowers/main/.pi/scripts/setup.sh | bash
```

Or if you've already cloned the repository:

```bash
cd /path/to/superpowers
.pi/scripts/setup.sh
```

### Manual Installation

1. **Clone superpowers**:
   ```bash
   mkdir -p ~/.pi/agent/superpowers
   git clone https://github.com/obra/superpowers.git ~/.pi/agent/superpowers
   ```

2. **Register the extension**:
   ```bash
   mkdir -p ~/.pi/agent/extensions
   ln -sf ~/.pi/agent/superpowers/.pi/extensions/superpowers.ts ~/.pi/agent/extensions/superpowers.ts
   ```

3. **Restart pi coding agent**

## Architecture

### Extension Structure

The superpowers extension for pi (`/.pi/extensions/superpowers.ts`) provides:

1. **Custom Tools**:
   - `use_skill` - Load and inject a specific skill into the conversation

2. **Custom Commands**:
   - `/find_skills` - List all available skills with descriptions
   - `/superpowers_update` - Check for superpowers updates

3. **Lifecycle Event Handlers**:
   - `session_start` - Auto-inject bootstrap with full `using-superpowers` skill
   - `session_before_compact` - Re-inject compact bootstrap to survive context compaction

### Directory Structure

```
~/.pi/agent/
├── superpowers/                    # Superpowers installation
│   ├── .pi/
│   │   └── extensions/
│   │       └── superpowers.ts      # Extension implementation
│   ├── lib/
│   │   └── skills-core.js          # Shared utility functions
│   └── skills/                     # Core skills library
│       ├── using-superpowers/
│       ├── test-driven-development/
│       ├── brainstorming/
│       └── ...
├── extensions/
│   └── superpowers.ts              # Symlink to extension
└── skills/                         # Personal skills directory
    └── my-skill/
        └── SKILL.md

/path/to/project/
└── .pi/
    └── skills/                     # Project-specific skills
        └── project-skill/
            └── SKILL.md
```

### Skill Resolution Priority

When loading a skill, the system searches in this order:

1. **Project skills** (`.pi/skills/`) - Project-specific workflows
2. **Personal skills** (`~/.pi/agent/skills/`) - Your custom skills
3. **Superpowers skills** (`~/.pi/agent/superpowers/skills/`) - Core library

Skills can be loaded with explicit namespaces:
- `project:skill-name` - Force project skill
- `superpowers:skill-name` - Force superpowers skill
- `skill-name` - Search with priority order

## Usage

### Bootstrap Injection

The extension automatically injects the `using-superpowers` skill at session start. This provides the agent with:
- Overview of all available skills
- Instructions on when and how to use skills
- Tool mapping for pi-specific tools

**Important**: The bootstrap is injected automatically - you don't need to manually load `using-superpowers`.

### Loading Skills

**Via Tool (LLM-initiated)**:

Ask the agent to load a skill naturally:
```
Please use the test-driven-development skill for this task
```

The agent will use the `use_skill` tool:
```
use_skill({ skill_name: "superpowers:test-driven-development" })
```

**Via Command (User-initiated)**:

Load a skill directly:
```
/use_skill brainstorming
```

### Finding Skills

Use the `/find_skills` command:
```
/find_skills
```

This displays all available skills with:
- Namespace prefix (`project:`, personal, `superpowers:`)
- Description
- Directory location

### Creating Skills

#### Personal Skills

Create custom skills in `~/.pi/agent/skills/`:

```bash
mkdir -p ~/.pi/agent/skills/my-workflow
cat > ~/.pi/agent/skills/my-workflow/SKILL.md <<'EOF'
---
name: my-workflow
description: Use when implementing my custom workflow
---

# My Custom Workflow

## When to Use
Use this skill when [specific condition].

## Steps
1. First step
2. Second step
3. Third step

## Expected Outcome
[What success looks like]
EOF
```

#### Project Skills

Create project-specific skills in `.pi/skills/`:

```bash
# In your project directory
mkdir -p .pi/skills/api-conventions
cat > .pi/skills/api-conventions/SKILL.md <<'EOF'
---
name: api-conventions
description: Use when creating or modifying API endpoints in this project
---

# API Conventions for This Project

## Naming Conventions
- Use RESTful naming
- Plural resource names
- Kebab-case for URLs

## Authentication
All endpoints require JWT auth via Authorization header.

## Response Format
```json
{
  "data": {},
  "meta": {},
  "errors": []
}
```
EOF
```

### Skill Format

Skills use YAML frontmatter for metadata:

```markdown
---
name: skill-name
description: Use when [condition] - [what it does]
---

# Skill Name

[Skill content in Markdown]

## When to Use
[Description of when this skill applies]

## Process
[Step-by-step workflow]

## Tools and Techniques
[Specific guidance]
```

## Extension Development

### Modifying the Extension

The extension is written in TypeScript and uses pi's ExtensionAPI:

```typescript
export default function (pi: ExtensionAPI) {
  // Register custom tools
  pi.registerTool({
    name: "tool_name",
    description: "Tool description",
    parameters: { /* schema */ },
    async execute(toolCallId, params, onUpdate, ctx, signal) {
      // Implementation
    }
  });

  // Register custom commands
  pi.registerCommand({
    name: "command_name",
    description: "Command description",
    handler: async (ctx) => {
      // Implementation
    }
  });

  // Register event handlers
  pi.on("session_start", async (event) => {
    // Handler
  });
}
```

### Available Events

The extension uses these pi lifecycle events:

- `session_start` - Triggered when a new session begins
- `session_before_compact` - Triggered before context compaction
- `session_tree` - Available for session tree reconstruction
- `session_fork` - Available for handling session branches

See [pi coding agent docs](https://github.com/badlogic/pi-mono) for full event list.

### Shared Core Library

The extension uses `lib/skills-core.js` for shared functionality:

```typescript
import * as skillsCore from "../../lib/skills-core.js";

// Extract YAML frontmatter
const { name, description } = skillsCore.extractFrontmatter(skillFile);

// Remove frontmatter from content
const content = skillsCore.stripFrontmatter(fullContent);

// Find all skills in directory
const skills = skillsCore.findSkillsInDir(directory, sourceType, maxDepth);

// Resolve skill path with priority
const resolved = skillsCore.resolveSkillPath(skillName, superpowersDir, personalDir);

// Check for git updates
const hasUpdates = skillsCore.checkForUpdates(repoDir);
```

## Tool Mapping

When skills reference tools from other platforms, use these pi equivalents:

| Claude Code/OpenCode | pi coding agent | Notes |
|---------------------|-----------------|-------|
| `TodoWrite` | `update_plan` or custom extension | Create custom todo extension if needed |
| `Task` with subagents | Manual breakdown | Use extension system for parallelization |
| `Skill` | `use_skill` | Provided by superpowers extension |
| `Read`, `Write`, `Edit` | Native tools | Use pi's built-in file tools |
| `Bash` | `exec` via extension | Available in tool execution context |

## Updating

### Manual Update

```bash
cd ~/.pi/agent/superpowers
git pull
```

### Command Update Check

```
/superpowers_update
```

Displays:
- ✓ Up to date
- ⚠️ Update available with instructions

## Troubleshooting

### Extension Not Loading

**Symptoms**: No `use_skill` tool, `/find_skills` command not found

**Solutions**:
1. Verify extension exists:
   ```bash
   ls ~/.pi/agent/superpowers/.pi/extensions/superpowers.ts
   ```

2. Check symlink:
   ```bash
   ls -la ~/.pi/agent/extensions/superpowers.ts
   ```

3. Load explicitly:
   ```bash
   pi --extension ~/.pi/agent/superpowers/.pi/extensions/superpowers.ts
   ```

4. Check pi logs for errors

### Skills Not Found

**Symptoms**: `use_skill` returns "Skill not found"

**Solutions**:
1. Verify skills directory:
   ```bash
   ls ~/.pi/agent/superpowers/skills
   ```

2. Check skill structure:
   ```bash
   ls ~/.pi/agent/superpowers/skills/brainstorming/SKILL.md
   ```

3. Use `/find_skills` to see discovered skills

### TypeScript/Import Errors

**Symptoms**: Extension fails to load with module errors

**Solutions**:
1. Ensure Node.js is installed:
   ```bash
   node --version
   ```

2. Check relative import paths in extension
3. Verify `lib/skills-core.js` exists
4. Run with verbose logging:
   ```bash
   pi --verbose
   ```

### Bootstrap Not Appearing

**Symptoms**: Agent doesn't know about superpowers

**Solutions**:
1. Verify `session_start` event fires (check logs)
2. Check `using-superpowers` skill exists:
   ```bash
   ls ~/.pi/agent/superpowers/skills/using-superpowers/SKILL.md
   ```
3. Manually trigger with `/use_skill superpowers:using-superpowers`

## Advanced Usage

### Custom Bootstrap

Modify bootstrap content in `.pi/extensions/superpowers.ts`:

```typescript
const getBootstrapContent = (compact = false): string | null => {
  // Customize tool mapping
  const toolMapping = `**Custom Tool Mapping:**
- Custom tools for your workflow
- Modified instructions for your setup`;

  return `<EXTREMELY_IMPORTANT>
${content}
${toolMapping}
</EXTREMELY_IMPORTANT>`;
};
```

### Environment Variables

- `PI_CONFIG_DIR` - Override default config directory (default: `~/.pi/agent`)

Example:
```bash
export PI_CONFIG_DIR=~/my-custom-pi-config
pi
```

### Integration with Other Extensions

Load multiple extensions together:

```bash
pi --extension ~/.pi/agent/extensions/superpowers.ts \
   --extension ~/.pi/agent/extensions/my-extension.ts
```

Extensions can interact via shared session state and custom entries.

## Example Workflows

### 1. Starting a New Feature

```
User: I need to implement user authentication
Agent: I'll use the test-driven-development skill for this task
Agent: [uses use_skill tool]
Agent: Following TDD, let's start by writing tests...
```

### 2. Code Review

```
User: Please review my PR
Agent: I'll use the requesting-code-review skill
Agent: [uses use_skill tool]
Agent: Based on the code review skill, I'll check for:
- Test coverage
- Edge cases
- Documentation
...
```

### 3. Project-Specific Conventions

```
# Create project skill
mkdir -p .pi/skills/naming-conventions
cat > .pi/skills/naming-conventions/SKILL.md <<'EOF'
---
name: naming-conventions
description: Use when creating new files or functions
---

# Project Naming Conventions

- Components: PascalCase
- Utilities: camelCase
- Constants: SCREAMING_SNAKE_CASE
EOF

# Use in session
User: Create a new API client
Agent: I'll use the project:naming-conventions skill
Agent: [follows project conventions automatically]
```

## Reference

### Available Core Skills

- `using-superpowers` - Meta-skill for superpowers usage (auto-loaded)
- `test-driven-development` - TDD workflow and practices
- `systematic-debugging` - Methodical debugging approach
- `brainstorming` - Structured brainstorming techniques
- `writing-plans` - Planning and architecture
- `executing-plans` - Plan execution workflows
- `requesting-code-review` - Code review checklist
- `receiving-code-review` - Responding to reviews
- `using-git-worktrees` - Git worktree workflows
- `finishing-a-development-branch` - Branch cleanup
- `verification-before-completion` - Pre-completion checks
- `writing-skills` - Creating new skills
- And more...

### Extension API Reference

See [pi coding agent extension docs](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/README.md#extensions) for:
- Full ExtensionAPI interface
- Tool parameter schemas (TypeBox)
- UI component API
- State persistence
- Event types

## Contributing

### Reporting Issues

Report pi-specific issues to:
- Superpowers: https://github.com/obra/superpowers/issues
- pi coding agent: https://github.com/badlogic/pi-mono/issues

### Contributing Skills

Skills are welcome for all platforms. When creating skills:
1. Use platform-agnostic language where possible
2. Provide tool mappings for different platforms
3. Test with multiple coding agents
4. Follow the [writing-skills](../skills/writing-skills/SKILL.md) guide

### Extension Improvements

Submit PRs to improve the pi extension:
- Better error handling
- Performance optimizations
- Additional commands
- Enhanced UI integration

## License

See [LICENSE](../LICENSE) for details.

## Links

- **Superpowers**: https://github.com/obra/superpowers
- **pi coding agent**: https://github.com/badlogic/pi-mono
- **Skills Library**: https://github.com/obra/superpowers-skills
- **Issue Tracker**: https://github.com/obra/superpowers/issues
