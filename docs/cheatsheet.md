# Cheatsheet

Quick reference for all commands, skills, agents, and hooks.

---

## Commands (Slash Commands)

| Command | What It Does | When to Use |
|---------|--------------|-------------|
| `/setup-hooks` | Resets git + runs `npm install` in hooks | After cloning this template |
| `/init-infra-setup` | Copies `.claude/` folder to project | Adding infra to existing project |
| `/add-skill` | Creates new skill folder + SKILL.md | Creating a custom skill |
| `/dev-docs` | Creates dev docs in `dev/active/` | Documenting a feature |
| `/route-test` | Tests API endpoints with curl | Testing an API route |

---

## Skills

Skills provide inline guidance and auto-activate based on triggers.

### backend-dev-guidelines
**Purpose:** Node.js/Next.js API routes, Supabase integration

**Triggers:**
- Prompt: `api`, `route`, `endpoint`, `backend`, `supabase`, `database`, `auth`, `middleware`
- Files: `app/api/**/*`, `services/**/*`, `middleware.ts`

### frontend-dev-guidelines
**Purpose:** React/Next.js components, MUI styling

**Triggers:**
- Prompt: `component`, `react`, `ui`, `frontend`, `mui`, `hook`, `useState`, `form`
- Files: `app/**/*.tsx`, `components/**/*`, `hooks/**/*`

### add-skill
**Purpose:** Create and manage skills, 500-line rule

**Triggers:**
- Prompt: `add skill`, `create skill`, `new skill`, `help me to add skill`
- Files: `.claude/skills/**/*`

### route-tester
**Purpose:** API endpoint testing

**Triggers:**
- Prompt: `test route`, `test api`, `test endpoint`, `curl`, `integration test`
- Files: `__tests__/api/**/*`, `*.test.ts`

### error-tracking
**Purpose:** Error handling, logging, debugging

**Triggers:**
- Prompt: `error`, `bug`, `fix`, `debug`, `crash`, `exception`, `log`
- Files: `lib/errors/**/*`, `sentry.*`

### date-aware
**Purpose:** Ensures accurate date/time usage

**Triggers:**
- Prompt: `date-aware`, `check date`, `current date`, `changelog`, `release notes`
- Files: `CHANGELOG.md`, `docs/**/*`

---

## Agents

Agents handle complex multi-step tasks autonomously. Trigger by saying the phrase.

| Agent | Trigger Phrases | Purpose |
|-------|-----------------|---------|
| `plan-reviewer` | "review plan", "check my plan", "validate plan" | Reviews implementation plans |
| `auto-error-resolver` | "fix error", "resolve error", "typescript error" | Auto-fixes common errors |
| `web-research-specialist` | "research this", "find best practices", "investigate" | Researches technical topics |
| `code-architecture-reviewer` | "architecture review", "code review", "review architecture" | Reviews code structure |
| `code-refactor-master` | "refactor code", "code refactor", "refactoring" | Executes refactoring |
| `refactor-planner` | "plan refactor", "refactoring plan", "plan restructure" | Plans refactoring efforts |
| `frontend-error-fixer` | "fix frontend error", "react error", "hydration error" | Fixes React/Next.js errors |
| `documentation-architect` | "create docs", "write documentation", "document this" | Creates documentation |
| `auth-route-tester` | "test auth", "test authentication", "test protected route" | Tests auth endpoints |
| `auth-route-debugger` | "debug auth", "authentication not working", "login issues" | Debugs auth issues |

### Agent Examples

```
"review my plan for the new feature"
  → triggers plan-reviewer

"fix this typescript error"
  → triggers auto-error-resolver

"research best practices for caching"
  → triggers web-research-specialist

"refactor this component"
  → triggers code-refactor-master

"fix this react hydration error"
  → triggers frontend-error-fixer
```

---

## Hooks

Hooks run automatically on events.

| Hook | Event | Purpose | Disable |
|------|-------|---------|---------|
| `date-injection.sh` | UserPromptSubmit | Injects current date | `SKIP_DATE_INJECTION=1` |
| `skill-activation-prompt.sh` | UserPromptSubmit | Auto-activates skills | - |
| `post-tool-use-tracker.sh` | PostToolUse | Tracks file edits | - |
| `tsc-check.sh` | Stop | TypeScript build check | - |
| `trigger-build-resolver.sh` | Stop | Triggers error resolver | - |

---

## Configuration

### Disable Features

```bash
# Disable date injection hook
export SKIP_DATE_INJECTION=1

# Custom date format
export DATE_FORMAT='%Y-%m-%d'
```

### File Locations

```
.claude/
├── settings.json      # Main configuration
├── commands/          # Slash commands (/command-name)
├── skills/            # Skills (auto-activate)
│   └── skill-rules.json
├── agents/            # Agents (multi-step tasks)
└── hooks/             # Event hooks
    └── package.json   # Hook dependencies
```

---

## Setup for New Projects

### Option 1: Clone as Template (New Project)
```bash
git clone <this-repo> my-project
cd my-project
/setup-hooks
```
`/setup-hooks` automatically: resets git + installs hook dependencies

### Option 2: Apply to Existing Project
```bash
/init-infra-setup
```
Copies `.claude/` folder to your project, then run `/setup-hooks`
