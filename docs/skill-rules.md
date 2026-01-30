# Skill Rules Configuration

This project uses `skill-rules.json` as **centralized frontmatter in JSON format**. Instead of requiring YAML frontmatter in each SKILL.md file, all activation rules are defined in one place.

## Why No Frontmatter Needed

Native Claude Code requires frontmatter in each SKILL.md:

```yaml
---
name: my-skill
description: When to use this skill
---
```

**This project's approach**: Define all triggers in `skill-rules.json` instead. The hook system reads this file and handles activation, so SKILL.md files can be **pure content** without frontmatter.

| Approach | Where Triggers Live | SKILL.md Needs Frontmatter |
|----------|---------------------|---------------------------|
| Native Claude Code | Each SKILL.md | **Yes** |
| Enhanced (this project) | skill-rules.json | **No** |

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
  2. Extracts user's prompt from stdin
  3. Matches prompt against triggers.prompt keywords
  4. Matches file context against triggers.files patterns
  5. Sorts matches by priority
  6. Outputs JSON with suggested/auto-activated skills
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

### Hook Script (skill-activation-prompt.sh)

```bash
#!/bin/bash
cd "$CLAUDE_PROJECT_DIR/.claude/hooks"
cat | npx tsx skill-activation-prompt.ts
```

Pipes stdin (user's prompt as JSON) to the TypeScript processor.

### TypeScript Processor (skill-activation-prompt.ts)

Key functions:

1. **loadSkillRules()** — Reads `.claude/skills/skill-rules.json`
2. **matchesPromptTriggers()** — Checks if prompt contains trigger keywords
3. **matchesFileTriggers()** — Checks if files match glob patterns
4. **analyzeAndSuggestSkills()** — Returns matched skills sorted by priority
5. **generateActivationMessage()** — Formats output for Claude

### Hook Output Format

```json
{
  "suggestions": ["backend-dev-guidelines", "error-tracking"],
  "message": "[Skill Activation Analysis]\n→ Suggested: /backend-dev-guidelines\n→ Suggested: /error-tracking",
  "autoActivate": []
}
```

## File Location

```
.claude/skills/skill-rules.json
```

## Configuration Structure

```json
{
  "$schema": "./skill-rules.schema.json",
  "version": "1.0.0",
  "description": "Skill activation rules for my-project",

  "skills": {
    "skill-name": {
      "description": "What this skill does",
      "triggers": {
        "prompt": ["keyword1", "keyword2"],
        "files": ["path/pattern/**/*"]
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

## Skill Configuration

### triggers.prompt

Keywords in user's message that trigger the skill:

```json
"triggers": {
  "prompt": [
    "api", "route", "endpoint",
    "backend", "server", "database"
  ]
}
```

- Case-insensitive matching
- Partial word matching (e.g., "api" matches "API route")
- Use phrases for precision (e.g., "test api" vs just "test")

### triggers.files

Glob patterns for files being worked on:

```json
"triggers": {
  "files": [
    "app/api/**/*",
    "lib/supabase/**/*",
    "*.test.ts"
  ]
}
```

- Standard glob syntax (`**` for recursive, `*` for wildcard)
- Matches files in current context or recently edited

### enforcement

How the skill is activated:

| Level | Behavior |
|-------|----------|
| `auto` | Activate immediately without asking |
| `suggest` | Show suggestion to user |
| `manual` | Only when user explicitly invokes |

```json
"enforcement": "suggest"
```

### priority

Lower numbers = higher priority. When multiple skills match:

```json
"priority": 0  // Highest priority
"priority": 1  // High
"priority": 2  // Normal
```

Skills are sorted by priority, limited by `maxSkillsPerPrompt`.

## Global Settings

```json
"globalSettings": {
  "maxSkillsPerPrompt": 3,
  "defaultEnforcement": "suggest",
  "showSkillSuggestions": true,
  "logActivations": true
}
```

| Setting | Purpose | Default |
|---------|---------|---------|
| `maxSkillsPerPrompt` | Max skills to activate per prompt | 3 |
| `defaultEnforcement` | Default if not specified | `suggest` |
| `showSkillSuggestions` | Show activation hints | `true` |
| `logActivations` | Log skill activations | `true` |

## Example Configurations

### Backend Development Skill

```json
"backend-dev-guidelines": {
  "description": "Node.js/Next.js API routes, Supabase integration",
  "triggers": {
    "prompt": [
      "api", "route", "endpoint", "backend", "server",
      "supabase", "database", "query", "middleware"
    ],
    "files": [
      "app/api/**/*",
      "pages/api/**/*",
      "lib/supabase/**/*",
      "middleware.ts"
    ]
  },
  "enforcement": "suggest",
  "priority": 1
}
```

### High-Priority Auto-Activation

```json
"add-skill": {
  "description": "Create and manage skills",
  "triggers": {
    "prompt": [
      "add skill", "create skill", "new skill",
      "help me to add skill"
    ],
    "files": [
      ".claude/skills/**/*",
      "SKILL.md"
    ]
  },
  "enforcement": "auto",
  "priority": 0
}
```

### Error Tracking

```json
"error-tracking": {
  "description": "Error handling, debugging, monitoring",
  "triggers": {
    "prompt": [
      "error", "bug", "fix", "debug", "crash",
      "exception", "log", "stack trace"
    ],
    "files": [
      "lib/errors/**/*",
      "lib/logging/**/*",
      "*.error.ts"
    ]
  },
  "enforcement": "suggest",
  "priority": 2
}
```

## Integration with Hooks

The skill-rules.json is processed by hooks defined in `settings.json`:

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

The hook script:
1. Receives the user's prompt as input
2. Loads skill-rules.json
3. Matches triggers against prompt and file context
4. Outputs skill suggestions

## Native vs Enhanced Activation

| Feature | Native (frontmatter) | Enhanced (skill-rules.json) |
|---------|---------------------|----------------------------|
| Trigger source | `description` field in SKILL.md | `triggers.prompt` + `triggers.files` |
| File patterns | Not supported | Supported |
| Priority control | Not supported | Supported |
| Enforcement levels | Limited | Full control (`auto`, `suggest`, `manual`) |
| Max skills limit | Not supported | Supported via `maxSkillsPerPrompt` |
| Centralized config | No (scattered in each file) | Yes (one JSON file) |
| Frontmatter required | **Yes** | **No** |

### Why This Project Uses Enhanced Only

1. **Centralized management** — All triggers in one file, easy to review and update
2. **No frontmatter maintenance** — SKILL.md files are pure content
3. **File-based triggers** — Activate skills based on what files you're editing
4. **Priority control** — Prevent skill conflicts with explicit ordering
5. **Enforcement levels** — Fine-grained control over auto vs suggested

### Trade-off

Skills without frontmatter won't appear in Claude's native `/` menu autocomplete. This project accepts this trade-off because:
- The hook system handles activation
- Users can still type `/skill-name` manually
- Skills in `.claude/commands/` (which don't need frontmatter) appear in the menu

### If You Want Both Systems

Add frontmatter to SKILL.md files for native recognition while keeping skill-rules.json for enhanced triggers:

```yaml
---
name: backend-dev-guidelines
description: Node.js/Next.js API routes, Supabase integration
---

# Backend Development Guidelines
...
```

This gives you:
- Native Claude Code recognition (appears in `/` menu)
- Enhanced triggers (file patterns, priorities)

## Customization Tips

### 1. Adapt Path Patterns

Update `triggers.files` to match your project structure:

```json
// Monorepo
"files": ["packages/backend/src/**/*"]

// Single app
"files": ["src/api/**/*"]
```

### 2. Use Specific Keywords

Prefer phrases over single words to reduce false positives:

```json
// Better
"prompt": ["test api", "api test", "integration test"]

// Too broad
"prompt": ["test", "api"]
```

### 3. Set Appropriate Enforcement

- `auto` — For critical workflows (add-skill)
- `suggest` — For most skills (default)
- `manual` — For rarely-used or sensitive skills

### 4. Use Priority for Conflicts

When multiple skills might match, set priorities:

```json
// More specific skill = lower priority number
"error-tracking": { "priority": 2 }
"backend-dev-guidelines": { "priority": 1 }
"add-skill": { "priority": 0 }  // Always wins
```

## Troubleshooting

### Skill Not Activating

1. Check `triggers.prompt` keywords are in your message
2. Verify `triggers.files` patterns match your files
3. Check `enforcement` is not `manual`
4. Ensure hook is registered in `settings.json`

### Too Many Skills Activating

1. Reduce `maxSkillsPerPrompt` in global settings
2. Make keywords more specific
3. Increase priority numbers for less important skills

### Hook Not Running

1. Verify `settings.json` hook configuration
2. Check `skill-activation-prompt.sh` is executable
3. Ensure Node.js/tsx is available
