---
name: add-skill
description: >
  Create and manage Claude Code skills using the enhanced activation system.
  Trigger phrases: add skill, create skill, new skill, help me to add skill, refactor skill
---

# Add Skill

Create, manage, and refactor Claude Code skills using the enhanced activation system (skill-rules.json).

## Activation

This skill activates when you:
- Say "help me to add skill", "create skill", "new skill"
- Work with files in `.claude/skills/`
- Need to refactor or modularize existing skills

## Quick Reference

| Task | Action |
|------|--------|
| Create new skill | `@agent documentation-architect` or follow steps below |
| Edit triggers | Update `.claude/skills/skill-rules.json` |
| Test activation | Type prompt with trigger keywords |
| Refactor large skill | Split into SKILL.md + resources/ |

## Enhanced Activation System

This project uses `skill-rules.json` as **centralized frontmatter**. No YAML frontmatter needed in SKILL.md files.

### How It Works

```
User submits prompt
       ↓
UserPromptSubmit hook fires
       ↓
skill-activation-prompt.ts reads skill-rules.json
       ↓
Matches triggers (keywords + file patterns)
       ↓
Suggests or auto-activates skills
```

### Frontmatter Strategy

This skill uses frontmatter for native Claude Code recognition (appears in `/` menu). Other skills can skip frontmatter if they only need enhanced activation.

| Approach | `/` Menu | Enhanced Triggers | When to Use |
|----------|----------|-------------------|-------------|
| Frontmatter + skill-rules.json | Yes | Yes | Critical skills (like this one) |
| skill-rules.json only | No | Yes | Most project skills |

## Creating a New Skill

### Method 1: Agent-Based (Recommended)

```
@agent documentation-architect

Create a new skill called "[name]" for [purpose].

The skill should:
- Activate when user mentions: [keywords]
- Activate when editing files: [patterns]
- Include guidelines for: [topics]

Follow the 500-line rule.
```

### Method 2: Manual

Follow the steps below to create a skill manually.

## Skill Structure

```
.claude/skills/[skill-name]/
├── SKILL.md           # Main content (max 500 lines)
└── resources/         # Detailed documentation
    ├── patterns.md
    ├── examples.md
    └── reference.md
```

## skill-rules.json Entry

```json
"[skill-name]": {
  "description": "Brief description",
  "triggers": {
    "prompt": ["keyword1", "keyword2"],
    "files": ["path/**/*", "*.ext"]
  },
  "enforcement": "suggest",
  "priority": 2
}
```

### Enforcement Levels

| Level | Behavior | Use For |
|-------|----------|---------|
| `auto` | Immediate activation | Critical workflows |
| `suggest` | Shows suggestion | Most skills |
| `manual` | Only `/skill-name` | Specialized tools |

### Priority

```
0 = Critical (add-skill)
1 = High (core guidelines)
2 = Normal (default)
3 = Low (supporting)
```

## The 500-Line Rule

Every SKILL.md must stay under 500 lines.

### When to Split

- File exceeds 400 lines
- Multiple distinct topics
- Extensive code examples
- Deep technical details

### How to Split

1. Keep SKILL.md as quick reference
2. Move detailed content to `resources/`
3. Link: `See [details.md](./resources/details.md)`

### Before (Monolithic)

```markdown
# My Skill
[... 600+ lines ...]
```

### After (Modular)

```markdown
# My Skill

## Quick Reference
[Tables, key points]

## Resources
- [patterns.md](./resources/patterns.md)
- [examples.md](./resources/examples.md)
```

## Refactoring Existing Skills

1. **Check line count**: `wc -l SKILL.md`
2. **Identify sections** that can be extracted
3. **Create resource files** for each major section
4. **Update SKILL.md** to reference resources
5. **Test** that skill still activates correctly

## Resources

See `resources/` for detailed guides:
- [skill-structure.md](./resources/skill-structure.md) - Directory structure
- [activation-rules.md](./resources/activation-rules.md) - Trigger configuration
- [modular-patterns.md](./resources/modular-patterns.md) - Splitting strategies
- [best-practices.md](./resources/best-practices.md) - Guidelines checklist
