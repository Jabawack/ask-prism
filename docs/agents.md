# Subagents

Subagents are specialized AI assistants that run in their own isolated context with separate conversation history, tools, and permissions.

## Key Concept

**Subagents run in SEPARATE context** — Unlike skills and commands (which run in your main conversation), subagents have their own context window. This isolates verbose work and preserves your main conversation.

## Why Use Subagents

- **Preserve context** — Keep exploration out of main conversation
- **Enforce constraints** — Limit tool access per agent
- **Run in parallel** — Multiple agents work simultaneously
- **Control costs** — Route to faster/cheaper models like Haiku
- **Background execution** — Run tasks while you continue working

## Location

| Location | Scope | Priority |
|----------|-------|----------|
| `.claude/agents/` | Project | Higher |
| `~/.claude/agents/` | Personal | Lower |

## Built-in Subagents

| Agent | Model | Tools | Purpose |
|-------|-------|-------|---------|
| `Explore` | Haiku | Read-only | Fast codebase search |
| `Plan` | Inherited | Read-only | Research during planning |
| `general-purpose` | Inherited | All | Complex multi-step tasks |

## Invoking Subagents

### Explicit Request

```
@agent code-reviewer
"use the debugger agent to fix this"
"have the test-runner check the tests"
```

### Automatic Delegation

Claude delegates based on the agent's `description` field. Add "use proactively" for eager delegation:

```yaml
description: >
  Expert code reviewer. Use proactively when code is written or modified.
```

### Background Execution

```
"run this in the background"
[Press Ctrl+B to background a running task]
```

Background agents:
- Run concurrently while you work
- Auto-deny permission prompts
- MCP tools unavailable

## Creating a Subagent

### Using `/agents` Command

```
/agents
→ Select "Create new agent"
→ Choose scope (User or Project)
→ Define tools, model, description
→ Save
```

### Manual File Creation

Create `.claude/agents/my-agent.md`:

```markdown
---
name: code-reviewer
description: >
  Expert code review specialist.
  Trigger phrases: code reviewer, review my code
tools: Read, Glob, Grep
model: sonnet
permissionMode: default
---

You are a senior code reviewer. When invoked:

1. Analyze code for:
   - Clarity and naming
   - Security issues
   - Performance concerns

2. Provide feedback organized by:
   - Critical (must fix)
   - Warnings (should fix)
   - Suggestions (consider)
```

## Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Unique identifier |
| `description` | Yes | When to delegate + triggers |
| `tools` | No | Available tools (inherits all if omitted) |
| `disallowedTools` | No | Tools to deny |
| `model` | No | `sonnet`, `opus`, `haiku`, or `inherit` |
| `permissionMode` | No | How to handle approvals |
| `skills` | No | Skills to load into agent |
| `hooks` | No | Lifecycle hooks |

## Permission Modes

| Mode | Behavior |
|------|----------|
| `default` | Standard permission prompts |
| `acceptEdits` | Auto-accept file edits |
| `dontAsk` | Auto-deny permission prompts |
| `bypassPermissions` | Skip all permission checks |
| `plan` | Plan mode (read-only) |

## Tool Restrictions

### Allow Specific Tools

```yaml
tools: Read, Grep, Glob
```

### Deny Specific Tools

```yaml
disallowedTools: Write, Edit, Bash
```

## Hooks

Subagents can define lifecycle hooks:

```yaml
---
name: db-reader
description: Execute read-only database queries
tools: Bash
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-readonly.sh"
---
```

## Skills in Subagents

Subagents don't inherit skills automatically. List them explicitly:

```yaml
---
name: code-reviewer
description: Review code using project standards
skills: backend-dev-guidelines, frontend-dev-guidelines
---
```

## Foreground vs Background

| Mode | Behavior |
|------|----------|
| **Foreground** | Blocks main conversation; permissions pass through |
| **Background** | Runs concurrently; auto-denies permissions |

## Example Agents

### Read-only Analyzer

```yaml
---
name: code-analyzer
description: Analyze code without making changes
tools: Read, Grep, Glob
model: haiku
---

Analyze code structure, find patterns, report issues.
Do not suggest fixes - only report findings.
```

### Debugger

```yaml
---
name: debugger
description: Debug errors and test failures
tools: Read, Edit, Bash, Grep, Glob
---

You are an expert debugger. When invoked:
1. Capture error and stack trace
2. Identify reproduction steps
3. Find root cause
4. Implement minimal fix
5. Verify solution
```

### Test Runner

```yaml
---
name: test-runner
description: Run tests and report failures
tools: Read, Bash
model: haiku
---

Run tests with `npm test`.
Report only failing tests with:
- Test name
- Error message
- Code location
```

## Agents in This Project

| Agent | Purpose |
|-------|---------|
| `code-architecture-reviewer` | Review code structure |
| `frontend-error-fixer` | Fix React/Next.js errors |
| `auto-error-resolver` | Analyze and fix errors |
| `auth-route-tester` | Test authentication routes |
| `documentation-architect` | Create/maintain docs |

## Disabling Agents

In `settings.json`:

```json
{
  "permissions": {
    "deny": ["Task(Explore)", "Task(my-agent)"]
  }
}
```

## Skills vs Commands vs Agents

| Aspect | Skills | Commands | Agents |
|--------|--------|----------|--------|
| **Invocation** | Claude auto-detects | You type `/command` | Claude delegates or `@agent` |
| **Runs in** | Main context | Main context | **Separate context** |
| **Has own history** | No | No | **Yes** |
| **Background** | No | No | **Yes** |
| **Tool restrictions** | Optional | Optional | **Yes** |

See [Skills vs Agents: Practical Guide](./skills-vs-agents.md) for detailed comparison.
