# Claude Code Project Configuration

This file provides context to Claude Code about this project.

## Project Type
Ask Prism - Document Analytics Platform with visual citations. Built with Next.js/React/Supabase.

## Git & Deployment Policy

- **NEVER commit, push, or deploy without EXPLICIT user consent.** - Always ask before committing
- **ALWAYS ask for confirmation** before running `git commit`, `git push`, `vercel`, or any deployment commands.
- Phrases like "before we deploy" or "when we deploy" are NOT consent - they indicate future intent.
- Only proceed when user says something like "deploy now", "yes deploy", "commit it", "push it".
- **NEVER mention Claude or AI in commit messages.** No "Co-Authored-By: Claude" or similar attribution.


## Date/Time Rules

- **ALWAYS use the system-injected date** - A hook injects current date/time into every prompt
- **NEVER guess or assume dates** - If no date is visible, run `date` command to get current time
- **Use current year (2026) for documentation** - Do not use outdated years from training data

## Key Conventions

### 500-Line Rule
- No file should exceed 500 lines
- Split large files into modular resources
- Use `/add-skill` for refactoring guidance

### Skill Structure
```
.claude/skills/[name]/
├── SKILL.md        # Max 500 lines, quick reference
└── resources/      # Detailed content, split by topic
```

### Auto-Activation
Skills activate based on:
1. Prompt keywords (from skill-rules.json)
2. File context (glob patterns)
3. Enforcement level (auto/suggest/manual)

## Stack Reference
- Runtime: Node.js
- Framework: Next.js (App Router)
- UI: React + MUI
- Database: Supabase
- Language: TypeScript
- Deployment: Vercel

## Common Tasks

### Add a New Skill
"Help me to add skill [name]" triggers add-skill

### Test API Routes
Use `/route-tester` or "test api endpoint"

### Debug Errors
"Error" or "debug" triggers error-tracking skill

### Review Code
Use `@agent code-architecture-reviewer`

## File Organization
```
.claude/
├── skills/       # Skill definitions
├── hooks/        # Automation hooks
├── agents/       # Specialized agents
├── commands/     # Slash commands
└── settings.json # Configuration
```
