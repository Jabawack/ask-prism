# Commands vs Skills vs Agents: Practical Guide

This guide explains the three extensibility mechanisms in Claude Code and when to use each.

## Quick Comparison

| Aspect | Commands | Skills | Agents |
|--------|----------|--------|--------|
| **Who invokes** | You (`/command`) | Claude (auto-detects) | Claude (delegates) or you (`@agent`) |
| **Location** | `.claude/commands/` | `.claude/skills/name/SKILL.md` | `.claude/agents/` |
| **Structure** | Single file | Directory + resources | Single file |
| **Runs in** | Main context | Main context | **Separate context** |
| **Own history** | No | No | **Yes** |
| **Background** | No | No | **Yes** |
| **Tool restrictions** | Optional | Optional | **Yes, per-agent** |
| **Purpose** | Quick prompts | Teach methodology | Isolate complex tasks |

## How Each Works

### Commands: User-Invoked Prompts

```
You type: /deploy staging
         ↓
Claude loads: .claude/commands/deploy.md
         ↓
Executes prompt in current conversation
```

**Key**: You must explicitly type `/command`.

### Skills: Model-Invoked Knowledge

```
You type: "Review this PR for security issues"
         ↓
Claude matches: description field mentions "PR", "security", "review"
         ↓
Claude loads: .claude/skills/code-review/SKILL.md
         ↓
Applies methodology in current conversation
```

**Key**: Claude decides based on your request matching the skill's `description`.

### Agents: Isolated Task Execution

```
You type: "@agent code-reviewer" or "use the debugger agent"
         ↓
Claude spawns: separate context with own history
         ↓
Agent works with restricted tools
         ↓
Returns results to main conversation
```

**Key**: Agent runs in isolation with its own context window.

## When to Use What

| Scenario | Use | Why |
|----------|-----|-----|
| Quick reusable prompt | Command | Explicit, predictable |
| Teach Claude methodology | Skill | Auto-applies when relevant |
| Comprehensive workflow | Skill + resources | Progressive disclosure |
| Verbose output (tests, logs) | Agent | Keeps main context clean |
| Parallel tasks | Agent | Multiple can run simultaneously |
| Restrict tools for safety | Agent | Per-agent tool control |
| Background execution | Agent | Run while you work |
| User must explicitly trigger | Command | Predictable invocation |
| Claude should auto-detect | Skill | Context-aware activation |

## Decision Tree

```
Do you want Claude to auto-detect when to use it?
├─ Yes → Skill
└─ No → Do you need isolated context?
         ├─ Yes → Agent
         └─ No → Command
```

## Practical Examples

### Example 1: Testing an API

You type: `test the api endpoint /api/users`

| Option | How | What Happens |
|--------|-----|--------------|
| Command | `/route-test GET /api/users` | Loads route-test.md, shows curl syntax |
| Skill | Claude detects "test api" | Loads route-tester skill, applies testing methodology |
| Agent | `@agent auth-route-tester` | Spawns agent, runs tests in isolation, returns results |

### Example 2: Code Review

You type: `review this code for security`

| Option | How | What Happens |
|--------|-----|--------------|
| Skill | Claude detects "review", "security" | Applies code-review skill in conversation |
| Agent | `@agent code-architecture-reviewer` | Reviews in separate context, returns findings |

### Example 3: Fixing Errors

You type: `fix this TypeScript error`

| Option | How | What Happens |
|--------|-----|--------------|
| Skill | Claude detects "error" | Applies error-tracking skill patterns |
| Agent | `@agent auto-error-resolver` | Investigates in isolation, fixes issue |

## File Locations

```
.claude/
├── commands/                 # User-invoked prompts
│   ├── route-test.md         # → /route-test
│   ├── add-skill.md          # → /add-skill
│   └── deploy.md             # → /deploy
│
├── skills/                   # Model-invoked knowledge
│   ├── route-tester/
│   │   ├── SKILL.md          # Main skill (max 500 lines)
│   │   └── resources/        # Detailed docs
│   ├── error-tracking/
│   │   └── SKILL.md
│   └── skill-rules.json      # Enhanced activation rules
│
└── agents/                   # Isolated task executors
    ├── code-reviewer.md
    ├── debugger.md
    └── test-runner.md
```

## Invocation Summary

| Mechanism | How to Invoke |
|-----------|---------------|
| Command | Type `/command-name` |
| Skill | Claude auto-detects OR `/skill-name` |
| Agent | `@agent name` OR "use the X agent" |

## Can They Work Together?

Yes:

1. **Command wraps Agent** — A `/doc-split` command could invoke the `documentation-architect` agent
2. **Skill uses Agent** — A skill with `context: fork` runs as an isolated agent
3. **Agent loads Skills** — Agents can have `skills: skill-name` to inherit knowledge

## Key Takeaways

1. **Commands** = Predictable, user-triggered shortcuts
2. **Skills** = Knowledge Claude applies automatically
3. **Agents** = Isolated execution with own context

Choose based on:
- **Who should trigger it?** — User → Command, Claude → Skill/Agent
- **Need isolation?** — Yes → Agent
- **Need auto-detection?** — Yes → Skill
