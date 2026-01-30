# Activation Rules Guide

This project uses **enhanced activation** via `skill-rules.json` and hooks, replacing native YAML frontmatter.

## How the Hook System Works

### The Flow

```
User submits prompt
       ↓
settings.json triggers UserPromptSubmit hook
       ↓
skill-activation-prompt.sh executes
       ↓
skill-activation-prompt.ts runs:
  1. Reads skill-rules.json
  2. Parses user's prompt from stdin
  3. Matches against triggers.prompt keywords
  4. Matches against triggers.files patterns
  5. Sorts by priority, limits by maxSkillsPerPrompt
  6. Outputs JSON with suggestions
       ↓
Claude receives skill suggestions
```

### Hook Registration (settings.json)

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/skill-activation-prompt.sh"
          }
        ]
      }
    ]
  }
}
```

### Hook Output Format

```json
{
  "suggestions": ["backend-dev-guidelines", "error-tracking"],
  "message": "[Skill Activation Analysis]\n→ Suggested: /backend-dev-guidelines",
  "autoActivate": ["add-skill"]
}
```

## Why No Frontmatter Needed

| Native Claude Code | Enhanced (This Project) |
|--------------------|------------------------|
| Requires frontmatter in each SKILL.md | Uses centralized skill-rules.json |
| `description` field triggers activation | `triggers.prompt` + `triggers.files` |
| No file pattern support | Full glob pattern support |
| No priority control | Priority numbers control order |
| Skills appear in `/` menu | Skills don't appear in `/` menu |

**Trade-off accepted**: Skills won't autocomplete in `/` menu, but gain file-based triggers and centralized management.

## skill-rules.json Structure

```json
{
  "skills": {
    "skill-name": {
      "description": "What this skill does",
      "triggers": {
        "prompt": ["keyword1", "keyword2"],
        "files": ["path/**/*", "*.ext"]
      },
      "enforcement": "suggest",
      "priority": 1
    }
  },
  "globalSettings": {
    "maxSkillsPerPrompt": 3,
    "defaultEnforcement": "suggest",
    "showSkillSuggestions": true,
    "logActivations": true
  }
}
```

## Trigger Types

### Prompt Triggers

Keywords that activate the skill when found in user prompts.

```json
"prompt": [
  "api",           // Single word
  "create route",  // Phrase
  "help me with"   // Partial match
]
```

**Best Practices:**
- Use lowercase (matching is case-insensitive)
- Include common variations
- Avoid overly generic terms
- Use phrases for precision ("test api" not just "test")

### File Triggers

Glob patterns that activate when user works with matching files.

```json
"files": [
  "app/api/**/*",     // All files in api directory
  "**/*.test.ts",     // All test files
  "lib/auth.ts"       // Specific file
]
```

**Supported Patterns:**
- `*` - Match any characters except `/`
- `**` - Match any characters including `/`
- `?` - Match single character
- `[abc]` - Match character class

## Enforcement Levels

### auto

Skill activates immediately without confirmation.

```json
"enforcement": "auto"
```

**Use for:** Critical skills that should always apply (e.g., add-skill)

### suggest

Suggests activation, user sees the suggestion.

```json
"enforcement": "suggest"
```

**Use for:** Most skills, optional guidelines

### manual

Only activates when explicitly called via `/skill-name`.

```json
"enforcement": "manual"
```

**Use for:** Specialized tools, rarely needed skills

## Priority System

Lower number = higher priority (activates first).

```json
"priority": 0  // Critical (add-skill)
"priority": 1  // Core (backend, frontend guidelines)
"priority": 2  // Supporting (testing, error tracking)
"priority": 3  // Low priority
```

When multiple skills match, they're sorted by priority and limited by `maxSkillsPerPrompt`.

## Global Settings

```json
"globalSettings": {
  "maxSkillsPerPrompt": 3,
  "defaultEnforcement": "suggest",
  "showSkillSuggestions": true,
  "logActivations": true
}
```

| Setting | Purpose |
|---------|---------|
| `maxSkillsPerPrompt` | Limit concurrent suggestions |
| `defaultEnforcement` | Fallback if not specified |
| `showSkillSuggestions` | Show activation hints |
| `logActivations` | Log for debugging |

## Testing Activation Rules

### Test Prompt Triggers

```
# Should trigger backend-dev-guidelines
"Help me create an API route"
"I need to add a database query"

# Should NOT trigger (too generic)
"Help me with something"
```

### Test File Triggers

1. Edit a file matching the pattern
2. Submit a prompt
3. Check if skill is suggested

### Debug Hook

If skills aren't activating:

1. Check `settings.json` hook registration
2. Verify `skill-activation-prompt.sh` is executable
3. Run manually: `echo '{"prompt":"test api"}' | .claude/hooks/skill-activation-prompt.sh`
4. Check skill-rules.json syntax
