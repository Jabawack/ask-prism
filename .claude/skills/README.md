# Skills

Context-aware skills that auto-activate based on prompts and file patterns.

## How Claude Picks a Skill

Claude reads the `description` field in each skill's SKILL.md frontmatter to decide when to activate it.

### IMPORTANT: Always List Trigger Phrases Explicitly

This is **required** for reliable activation:

```yaml
---
name: ux-expert
description: >
  UX expert for user experience design and usability.
  Trigger phrases: ux expert, ux review, usability review, user experience
---
```

When you say "use ux expert", Claude matches it against the description and activates the skill.

### Additional Tips (Recommended)

- **Describe the domain clearly** - helps Claude understand scope
  ```yaml
  description: Security expert for vulnerability analysis and secure coding
  ```

- **Be specific about when to use** - for proactive activation
  ```yaml
  description: Use proactively when reviewing authentication code
  ```

## Available Skills

| Skill | Purpose |
|-------|---------|
| `add-skill` | Create and manage Claude Code skills |
| `backend-dev-guidelines` | Node.js/Express/TypeScript patterns |
| `frontend-dev-guidelines` | React/MUI v7 patterns |
| `route-tester` | API endpoint testing |
| `error-tracking` | Sentry integration patterns |

## Skill Structure

```
.claude/skills/[skill-name]/
├── SKILL.md           # Main skill file (under 500 lines)
└── resources/         # Detailed resource files
    ├── core-concepts.md
    ├── patterns.md
    └── examples.md
```

## Creating a Skill

### Step 1: Create Directory

```bash
mkdir -p .claude/skills/my-skill/resources
```

### Step 2: Create SKILL.md

```yaml
---
name: my-skill
description: >
  Brief description of what this skill does.
  Trigger phrases: my skill, specific phrase, another trigger
---

# My Skill

## Purpose
What this skill helps with

## Quick Reference
Key patterns and examples
```

### Step 3: Update skill-rules.json

```json
{
  "my-skill": {
    "description": "Brief description",
    "triggers": {
      "prompt": ["keyword1", "keyword2"],
      "files": ["path/pattern/**/*"]
    },
    "enforcement": "suggest",
    "priority": 2
  }
}
```

## Enforcement Levels

| Level | Behavior |
|-------|----------|
| `auto` | Activates without confirmation |
| `suggest` | Suggests activation, user decides |
| `manual` | Only activates when explicitly called |

## Skills vs Agents

| Want to... | Use |
|------------|-----|
| Teach Claude a method/style | Skill |
| Isolate verbose work | Agent |
| Add project knowledge | Skill |
| Run tasks in parallel | Agent |
