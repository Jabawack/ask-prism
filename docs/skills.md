# Skills

Skills are markdown files that teach Claude specialized knowledge. Claude automatically loads them when your request matches the skill's description.

## Key Concept

**Skills are MODEL-invoked** — Claude decides when to use them based on your request matching the skill's `description` field. This differs from commands, which require explicit `/command` invocation.

## Location

| Location | Scope | Priority |
|----------|-------|----------|
| `.claude/skills/name/SKILL.md` | Project | Higher |
| `~/.claude/skills/name/SKILL.md` | Personal | Lower |

## How Activation Works

Claude follows this process:

1. **Discovery** — At startup, loads name and description of available skills
2. **Matching** — When your request matches a skill's description, Claude activates it
3. **Loading** — Full SKILL.md loads into context
4. **Execution** — Claude follows the skill's instructions

## Creating a Skill

### Basic Structure

Create `.claude/skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: >
  Brief description of what this skill does.
  Include keywords users might say to trigger it.
---

# My Skill

## Instructions
Step-by-step guidance for Claude.

## Examples
Concrete usage examples.
```

### Required Frontmatter

| Field | Required | Purpose |
|-------|----------|---------|
| `name` | Yes | Identifier (lowercase, hyphens, max 64 chars) |
| `description` | Yes | When to use + trigger keywords (max 1024 chars) |

**The `description` is critical** — Claude uses it to decide when to activate the skill.

### Optional Frontmatter

| Field | Purpose | Example |
|-------|---------|---------|
| `allowed-tools` | Restrict available tools | `Read, Grep, Glob` |
| `model` | Specific model to use | `sonnet`, `haiku` |
| `context` | Run in isolated context | `fork` |
| `user-invocable` | Show in `/` menu | `true` (default) |

## Writing Effective Descriptions

Claude uses the `description` to decide activation. Be specific:

**Bad:**
```yaml
description: Helps with documents
```

**Good:**
```yaml
description: >
  Extract text and tables from PDF files, fill forms, merge documents.
  Use when working with PDF files or when user mentions PDFs, forms,
  or document extraction.
```

## Multi-File Skills (Progressive Disclosure)

Keep SKILL.md under 500 lines. Use separate files for detailed content:

```
my-skill/
├── SKILL.md          # Overview (max 500 lines)
├── reference.md      # Detailed API docs
├── examples.md       # Usage examples
└── scripts/
    └── helper.py     # Utility scripts
```

Reference files in SKILL.md:

```markdown
## Additional Resources
- For API details, see [reference.md](reference.md)
- For examples, see [examples.md](examples.md)
```

## Configuration Options

### Restrict Tools

```yaml
---
name: read-only-analyzer
description: Analyze code without making changes
allowed-tools: Read, Grep, Glob
---
```

### Run in Isolated Context

```yaml
---
name: code-analysis
description: Generate detailed code reports
context: fork
---
```

Use `context: fork` for complex multi-step operations that would clutter the main conversation.

### Hide from Slash Menu

```yaml
---
name: internal-helper
description: Internal use only
user-invocable: false
---
```

Skill is still auto-discoverable but won't appear in `/` menu.

## Enhanced Activation (This Project)

This project uses `skill-rules.json` as **centralized frontmatter**. Instead of adding YAML frontmatter to each SKILL.md, all triggers are defined in one JSON file.

### Why No Frontmatter Needed

| Approach | Triggers Defined In | SKILL.md Needs Frontmatter |
|----------|---------------------|---------------------------|
| Native Claude Code | Each SKILL.md | **Yes** |
| Enhanced (this project) | skill-rules.json | **No** |

The hook system reads `skill-rules.json` and handles activation, so SKILL.md files can be **pure content**.

### How It Works

```
User submits prompt
       ↓
settings.json triggers UserPromptSubmit hook
       ↓
skill-activation-prompt.ts runs:
  1. Reads skill-rules.json
  2. Matches prompt keywords
  3. Matches file patterns
  4. Outputs suggested skills
       ↓
Claude receives suggestions
```

### skill-rules.json Structure

```json
{
  "skills": {
    "backend-dev-guidelines": {
      "description": "Node.js/Next.js API patterns",
      "triggers": {
        "prompt": ["api", "route", "backend", "supabase"],
        "files": ["app/api/**/*", "lib/supabase/**/*"]
      },
      "enforcement": "suggest",
      "priority": 1
    }
  }
}
```

### Enforcement Levels

| Level | Behavior |
|-------|----------|
| `auto` | Activate without asking |
| `suggest` | Suggest to user |
| `manual` | Only when explicitly requested |

### Trade-off

Skills without frontmatter won't appear in Claude's native `/` autocomplete menu. But:
- The hook system handles activation
- You can still type `/skill-name` manually
- Commands (`.claude/commands/`) appear in the menu without frontmatter

See [Skill Rules Configuration](./skill-rules.md) for full documentation.

## Skills in This Project

| Skill | Purpose | Triggers |
|-------|---------|----------|
| `backend-dev-guidelines` | Node.js/Next.js API patterns | api, route, backend |
| `frontend-dev-guidelines` | React/MUI development | component, react, ui |
| `route-tester` | API endpoint testing | test route, test api |
| `error-tracking` | Error handling patterns | error, bug, debug |
| `add-skill` | Create new skills | add skill, create skill |
| `date-aware` | Accurate date usage | date, changelog |

## Skills vs Commands vs Agents

| Aspect | Skills | Commands | Agents |
|--------|--------|----------|--------|
| **Invocation** | Claude auto-detects | You type `/command` | Claude delegates or you request |
| **Runs in** | Main context | Main context | Separate context |
| **Purpose** | Teach methodology | Quick prompts | Isolate complex tasks |

See [Skills vs Agents: Practical Guide](./skills-vs-agents.md) for detailed comparison.
