/**
 * Superpowers extension for pi coding agent
 *
 * Provides custom tools and commands for loading and discovering skills,
 * with automatic bootstrap injection at session start.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import skills-core utilities (adjust path as needed)
// Since pi uses TypeScript, we may need to adapt the CommonJS module
const skillsCoreModule = await import("../../lib/skills-core.js");
const skillsCore = skillsCoreModule.default || skillsCoreModule;

export default function (pi: ExtensionAPI) {
  const homeDir = os.homedir();
  const projectSkillsDir = path.join(pi.sessionManager.cwd, ".pi/skills");
  // Derive superpowers skills dir from extension location
  const superpowersSkillsDir = path.resolve(__dirname, "../../skills");
  // Respect PI_CONFIG_DIR if set, otherwise fall back to default
  const configDir = process.env.PI_CONFIG_DIR || path.join(homeDir, ".pi/agent");
  const personalSkillsDir = path.join(configDir, "skills");

  // Helper to generate bootstrap content
  const getBootstrapContent = (compact = false): string | null => {
    const usingSuperpowersPath = skillsCore.resolveSkillPath(
      "using-superpowers",
      superpowersSkillsDir,
      personalSkillsDir
    );
    if (!usingSuperpowersPath) return null;

    const fullContent = fs.readFileSync(usingSuperpowersPath.skillFile, "utf8");
    const content = skillsCore.stripFrontmatter(fullContent);

    const toolMapping = compact
      ? `**Tool Mapping:** TodoWrite->update_plan, Task->subagent, Skill->use_skill

**Skills naming (priority order):** project: > personal > superpowers:`
      : `**Tool Mapping for pi coding agent:**
When skills reference tools you don't have, substitute pi equivalents:
- \`TodoWrite\` → \`update_plan\` or custom todo tool
- \`Task\` tool with subagents → Use pi's extension system or manual task breakdown
- \`Skill\` tool → \`use_skill\` custom tool (registered by this extension)
- \`Read\`, \`Write\`, \`Edit\`, \`Bash\` → Your native tools

**Skills naming (priority order):**
- Project skills: \`project:skill-name\` (in .pi/skills/)
- Personal skills: \`skill-name\` (in ${configDir}/skills/)
- Superpowers skills: \`superpowers:skill-name\`
- Project skills override personal, which override superpowers when names match`;

    return `<EXTREMELY_IMPORTANT>
You have superpowers.

**IMPORTANT: The using-superpowers skill content is included below. It is ALREADY LOADED - you are currently following it. Do NOT use the use_skill tool to load "using-superpowers" - that would be redundant. Use use_skill only for OTHER skills.**

${content}

${toolMapping}
</EXTREMELY_IMPORTANT>`;
  };

  // Register use_skill tool
  pi.registerTool({
    name: "use_skill",
    description:
      "Load and read a specific skill to guide your work. Skills contain proven workflows, mandatory processes, and expert techniques.",
    parameters: {
      type: "object",
      properties: {
        skill_name: {
          type: "string",
          description:
            'Name of the skill to load (e.g., "superpowers:brainstorming", "my-custom-skill", or "project:my-skill")',
        },
      },
      required: ["skill_name"],
    },
    async execute(toolCallId, params, onUpdate, ctx, signal) {
      const { skill_name } = params as { skill_name: string };

      // Resolve with priority: project > personal > superpowers
      const forceProject = skill_name.startsWith("project:");
      const actualSkillName = forceProject ? skill_name.replace(/^project:/, "") : skill_name;

      let resolved: any = null;

      // Try project skills first (if project: prefix or no prefix)
      if (forceProject || !skill_name.startsWith("superpowers:")) {
        const projectPath = path.join(projectSkillsDir, actualSkillName);
        const projectSkillFile = path.join(projectPath, "SKILL.md");
        if (fs.existsSync(projectSkillFile)) {
          resolved = {
            skillFile: projectSkillFile,
            sourceType: "project",
            skillPath: actualSkillName,
          };
        }
      }

      // Fall back to personal/superpowers resolution
      if (!resolved && !forceProject) {
        resolved = skillsCore.resolveSkillPath(skill_name, superpowersSkillsDir, personalSkillsDir);
      }

      if (!resolved) {
        return `Error: Skill "${skill_name}" not found.\n\nUse the find_skills command to see available skills.`;
      }

      const fullContent = fs.readFileSync(resolved.skillFile, "utf8");
      const { name, description } = skillsCore.extractFrontmatter(resolved.skillFile);
      const content = skillsCore.stripFrontmatter(fullContent);
      const skillDirectory = path.dirname(resolved.skillFile);

      const skillHeader = `# ${name || skill_name}
# ${description || ""}
# Supporting tools and docs are in ${skillDirectory}
# ============================================`;

      // Return content for LLM consumption
      // In pi, tools return strings that become part of the conversation
      return `${skillHeader}\n\n${content}`;
    },
  });

  // Register find_skills command
  pi.registerCommand({
    name: "find_skills",
    description: "List all available skills in the project, personal, and superpowers skill libraries",
    handler: async (ctx) => {
      const projectSkills = skillsCore.findSkillsInDir(projectSkillsDir, "project", 3);
      const personalSkills = skillsCore.findSkillsInDir(personalSkillsDir, "personal", 3);
      const superpowersSkills = skillsCore.findSkillsInDir(superpowersSkillsDir, "superpowers", 3);

      // Priority: project > personal > superpowers
      const allSkills = [...projectSkills, ...personalSkills, ...superpowersSkills];

      if (allSkills.length === 0) {
        ctx.ui.notify(
          `No skills found. Install superpowers skills to ${superpowersSkillsDir}/ or add personal skills to ${personalSkillsDir}/`,
          "info"
        );
        return;
      }

      let output = "Available skills:\n\n";

      for (const skill of allSkills) {
        let namespace: string;
        switch (skill.sourceType) {
          case "project":
            namespace = "project:";
            break;
          case "personal":
            namespace = "";
            break;
          default:
            namespace = "superpowers:";
        }
        const skillName = skill.name || path.basename(skill.path);

        output += `${namespace}${skillName}\n`;
        if (skill.description) {
          output += `  ${skill.description}\n`;
        }
        output += `  Directory: ${skill.path}\n\n`;
      }

      // Display in UI
      ctx.ui.notify(output, "info");
    },
  });

  // Bootstrap injection at session start
  pi.on("session_start", async (event) => {
    const bootstrapContent = getBootstrapContent(false);
    if (!bootstrapContent) return;

    // Insert bootstrap as a custom entry visible to LLM
    // This will be part of the conversation context
    try {
      const session = pi.sessionManager.getActiveSession();
      if (session) {
        // Add a custom message entry that the LLM will see
        session.addEntry({
          type: "custom_message",
          role: "user",
          content: bootstrapContent,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      console.error("Failed to inject superpowers bootstrap:", err);
    }
  });

  // Re-inject compact bootstrap before context compaction
  pi.on("session_before_compact", async (event) => {
    const bootstrapContent = getBootstrapContent(true);
    if (!bootstrapContent) return;

    try {
      const session = pi.sessionManager.getActiveSession();
      if (session) {
        // Add compact version before compaction
        session.addEntry({
          type: "custom_message",
          role: "user",
          content: bootstrapContent,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      console.error("Failed to inject compact bootstrap:", err);
    }
  });

  // Optional: Check for updates command
  pi.registerCommand({
    name: "superpowers_update",
    description: "Check for superpowers updates",
    handler: async (ctx) => {
      const superpowersRepoDir = path.resolve(__dirname, "../..");
      const hasUpdates = skillsCore.checkForUpdates(superpowersRepoDir);

      if (hasUpdates) {
        ctx.ui.notify(
          `⚠️  Superpowers update available!\nTo update, run: cd ${superpowersRepoDir} && git pull`,
          "warning"
        );
      } else {
        ctx.ui.notify("✓ Superpowers is up to date", "info");
      }
    },
  });
}
