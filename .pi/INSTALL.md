# Installing Superpowers for pi coding agent

## Prerequisites

- [pi coding agent](https://github.com/badlogic/pi-mono) installed
- Node.js installed (for jiti TypeScript execution)
- Git installed

## Installation Steps

### 1. Install Superpowers

```bash
mkdir -p ~/.pi/agent/superpowers
git clone https://github.com/obra/superpowers.git ~/.pi/agent/superpowers
```

### 2. Register the Extension

Create a symlink so pi discovers the extension:

```bash
mkdir -p ~/.pi/agent/extensions
ln -sf ~/.pi/agent/superpowers/.pi/extensions/superpowers.ts ~/.pi/agent/extensions/superpowers.ts
```

### 3. Restart pi

Restart pi coding agent. The extension will automatically:
- Inject superpowers context at session start
- Register `use_skill` tool for loading skills
- Register `/find_skills` command for listing available skills

You should see superpowers is active when you ask "do you have superpowers?"

## Usage

### Finding Skills

Use the `/find_skills` command to list all available skills:

```
/find_skills
```

### Loading a Skill

Use the `use_skill` tool to load a specific skill:

```
use use_skill tool with skill_name: "superpowers:brainstorming"
```

Or ask the agent to use a skill naturally:
```
Please use the test-driven-development skill for this task
```

### Personal Skills

Create your own skills in `~/.pi/agent/skills/`:

```bash
mkdir -p ~/.pi/agent/skills/my-skill
```

Create `~/.pi/agent/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

Personal skills override superpowers skills with the same name.

### Project Skills

Create project-specific skills in your pi project:

```bash
# In your pi project directory
mkdir -p .pi/skills/my-project-skill
```

Create `.pi/skills/my-project-skill/SKILL.md`:

```markdown
---
name: my-project-skill
description: Use when [condition] - [what it does]
---

# My Project Skill

[Your skill content here]
```

**Skill Priority:** Project skills override personal skills, which override superpowers skills.

**Skill Naming:**
- `project:skill-name` - Force project skill lookup
- `skill-name` - Searches project → personal → superpowers
- `superpowers:skill-name` - Force superpowers skill lookup

## Updating

```bash
cd ~/.pi/agent/superpowers
git pull
```

Or use the built-in command:
```
/superpowers_update
```

## Troubleshooting

### Extension not loading

1. Check extension file exists: `ls ~/.pi/agent/superpowers/.pi/extensions/superpowers.ts`
2. Check pi logs for errors
3. Verify Node.js is installed: `node --version`
4. Try loading without auto-discovery: `pi --extension ~/.pi/agent/superpowers/.pi/extensions/superpowers.ts`

### Skills not found

1. Verify skills directory exists: `ls ~/.pi/agent/superpowers/skills`
2. Use `/find_skills` command to see what's discovered
3. Check file structure: each skill should have a `SKILL.md` file

### TypeScript/Module Issues

pi uses jiti for TypeScript execution. If you see module errors:
1. Ensure the extension can import from `../../lib/skills-core.js`
2. Check that Node.js can resolve the path from the extension location
3. Try running with debug output: `pi --verbose`

### Tool mapping issues

When a skill references a Claude Code or OpenCode tool you don't have:
- `TodoWrite` → use `update_plan` or create a custom todo extension
- `Task` with subagents → break down tasks manually or use pi's extension system
- `Skill` → use `use_skill` tool
- File operations → use your native tools

## Advanced Usage

### Using Extensions with Dependencies

If you create custom skills with dependencies, place a `package.json` next to your extension:

```json
{
  "dependencies": {
    "your-dependency": "^1.0.0"
  }
}
```

pi will automatically resolve these dependencies via jiti.

### Customizing Bootstrap

You can modify the bootstrap behavior by editing `.pi/extensions/superpowers.ts`:
- Adjust the `getBootstrapContent()` function for different tool mappings
- Modify event handlers to change when bootstrap is injected
- Add custom commands for your workflow

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Documentation: https://github.com/obra/superpowers
- pi coding agent docs: https://github.com/badlogic/pi-mono
