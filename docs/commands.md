# Slash Commands

Slash commands are user-defined prompts stored as Markdown files. They execute when you explicitly type `/command-name`.

## Key Concept

**Commands are USER-invoked** — You must type `/command` to trigger them. This differs from skills, which Claude auto-activates based on context.

## Location

| Location | Scope | Priority |
|----------|-------|----------|
| `.claude/commands/` | Project (shared with team) | Higher |
| `~/.claude/commands/` | Personal (all projects) | Lower |

If both locations have the same command name, the project command takes precedence.

## Creating a Command

Create a markdown file in `.claude/commands/`:

```markdown
# .claude/commands/deploy.md

Deploy the application to the specified environment.

## Steps
1. Run tests
2. Build the project
3. Deploy to $ARGUMENTS
```

Invoke with `/deploy staging`.

## Arguments

### All Arguments: `$ARGUMENTS`

Captures everything after the command name:

```markdown
# .claude/commands/fix-issue.md
Fix issue #$ARGUMENTS following our coding standards.
```

Usage: `/fix-issue 123 high-priority` → `$ARGUMENTS` = "123 high-priority"

### Positional Arguments: `$1`, `$2`, etc.

Access specific arguments:

```markdown
# .claude/commands/review-pr.md
Review PR #$1 with priority $2.
```

Usage: `/review-pr 456 high` → `$1` = "456", `$2` = "high"

## Bash Execution

Execute bash commands before the prompt using `!` prefix:

```markdown
# .claude/commands/commit.md
---
allowed-tools: Bash(git:*)
---

## Context
- Current status: !`git status`
- Current diff: !`git diff HEAD`
- Current branch: !`git branch --show-current`

## Task
Based on the above changes, create a commit.
```

## File References

Include file contents using `@` prefix:

```markdown
Review the implementation in @src/utils/helpers.js

Compare @src/old-version.js with @src/new-version.js
```

## Frontmatter Options

Commands support YAML frontmatter for configuration:

```yaml
---
allowed-tools: Bash(git:*), Read, Edit
argument-hint: [environment]
description: Deploy to specified environment
model: claude-3-5-haiku-20241022
---
```

| Field | Purpose | Default |
|-------|---------|---------|
| `allowed-tools` | Tools the command can use | Inherited |
| `argument-hint` | Shows in autocomplete | None |
| `description` | Brief description | First line |
| `model` | Specific model to use | Inherited |
| `context` | Set to `fork` for sub-agent | Inline |
| `hooks` | Define lifecycle hooks | None |

## Namespacing

Use subdirectories to group related commands:

```
.claude/commands/
├── frontend/
│   ├── component.md    → /component (project:frontend)
│   └── test.md         → /test (project:frontend)
└── backend/
    ├── migrate.md      → /migrate (project:backend)
    └── seed.md         → /seed (project:backend)
```

## Built-in Commands

Notable built-in commands:

| Command | Purpose |
|---------|---------|
| `/help` | Get usage help |
| `/clear` | Clear conversation history |
| `/compact` | Compact conversation |
| `/model` | Select AI model |
| `/plan` | Enter plan mode |
| `/agents` | Manage subagents |
| `/permissions` | View/update permissions |

## Commands in This Project

| Command | Purpose |
|---------|---------|
| `/route-test` | Quick API route testing |
| `/add-skill` | Create a new skill |
| `/dev-docs` | Development documentation |
| `/init-infra-setup` | Initialize infrastructure |
| `/setup-hooks` | Configure hooks |

## Commands vs Skills

| Aspect | Commands | Skills |
|--------|----------|--------|
| **Invocation** | You type `/command` | Claude auto-detects |
| **Location** | `.claude/commands/` | `.claude/skills/name/SKILL.md` |
| **Structure** | Single file | Directory + resources |
| **Purpose** | Quick prompts | Teach methodology |

See [Skills vs Agents: Practical Guide](./skills-vs-agents.md) for detailed comparison.
