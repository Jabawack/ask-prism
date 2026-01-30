# /init-infra-setup

Apply Claude Code infrastructure to any project with automatic stack detection.

## Workflow

Follow these steps in order:

---

## Step 0: Check Existing Infrastructure

First, check if `.claude/` folder already exists:

```bash
ls -la .claude/ 2>/dev/null
```

**If `.claude/` exists, ask user:**

```
Existing Claude Code infrastructure detected.

Current setup:
- Skills: [list what's in .claude/skills/]
- Agents: [count]
- Commands: [count]

What would you like to do?
1. Update/merge - Keep unique items, update common ones
2. Replace - Remove existing and apply fresh
3. Skip - Keep current setup, exit
```

**If no `.claude/` exists**, proceed to Step 1.

---

## Step 1: Analyze Target Repository

First, detect the project's tech stack by checking for these files:

**Language Detection:**
| File | Stack |
|------|-------|
| `package.json` | Node.js/JavaScript/TypeScript |
| `requirements.txt`, `pyproject.toml`, `setup.py` | Python |
| `go.mod` | Go |
| `Cargo.toml` | Rust |
| `pom.xml`, `build.gradle` | Java |
| `Gemfile` | Ruby |
| `composer.json` | PHP |

**Framework Detection:**
| Indicator | Framework |
|-----------|-----------|
| `next.config.*` | Next.js |
| `nuxt.config.*` | Nuxt |
| `vite.config.*` | Vite |
| `angular.json` | Angular |
| `svelte.config.*` | SvelteKit |
| `remix.config.*` | Remix |
| `manage.py` | Django |
| `app.py` or `flask` in deps | Flask |
| `fastapi` in deps | FastAPI |
| `rails` in deps | Rails |

**Database Detection:**
| Indicator | Database |
|-----------|----------|
| `supabase` in deps or `.supabase/` | Supabase |
| `prisma/` or `@prisma/client` | Prisma |
| `drizzle.config.*` | Drizzle |
| `.env` with `DATABASE_URL` | PostgreSQL/MySQL |
| `firebase` in deps | Firebase |
| `mongodb` in deps | MongoDB |

**Run this analysis:**
```bash
# Check for common stack files
ls -la package.json requirements.txt go.mod Cargo.toml 2>/dev/null

# If package.json exists, check dependencies
cat package.json | grep -E "(next|react|vue|angular|supabase|prisma)" 2>/dev/null
```

**Report findings to user before proceeding.**

---

## Step 2: Present Skills for Selection

Based on the detected stack, present this table and ask user what to keep/remove/add:

### Available Skills

| Skill | Best For | Recommend If |
|-------|----------|--------------|
| `backend-dev-guidelines` | API routes, server patterns | Any backend project |
| `frontend-dev-guidelines` | React, components, UI | React/Vue/Angular projects |
| `route-tester` | API testing | Projects with API routes |
| `error-tracking` | Debugging, error handling | All projects |
| `add-skill` | Creating new skills | All projects |
| `date-aware` | Date/time accuracy | Documentation-heavy projects |

### Stack-Specific Recommendations

**Next.js + Supabase (default):**
- Keep all skills as-is

**Python (Django/Flask/FastAPI):**
- Keep: `backend-dev-guidelines`, `route-tester`, `error-tracking`, `add-skill`
- Remove: `frontend-dev-guidelines` (unless using React frontend)
- Modify: Update file patterns in skill-rules.json (`.py` instead of `.ts`)

**Go:**
- Keep: `backend-dev-guidelines`, `route-tester`, `error-tracking`, `add-skill`
- Remove: `frontend-dev-guidelines`
- Modify: Update patterns for `.go` files

**Vue/Nuxt:**
- Keep all, modify `frontend-dev-guidelines` for Vue patterns

**Ask user:**
```
Based on your stack [detected stack], I recommend:
- Keep: [list]
- Remove: [list]
- Modify: [list]

Do you want to:
1. Accept recommendations
2. Customize selection
3. Keep everything (I'll adapt manually)
```

---

## Step 3: Copy and Customize

After user confirms selection:

### 3a. Copy Infrastructure
```bash
# Copy .claude folder to target project
cp -r .claude/ /path/to/target/project/

# Or if running from target project
cp -r /path/to/this-repo/.claude/ .
```

### 3b. Remove Unwanted Skills
```bash
# Example: Remove frontend skill for backend-only project
rm -rf .claude/skills/frontend-dev-guidelines/
```

### 3c. Update skill-rules.json

Modify file patterns for the detected stack:

**For Python:**
```json
"backend-dev-guidelines": {
  "triggers": {
    "files": ["**/*.py", "app/**/*", "api/**/*"]
  }
}
```

**For Go:**
```json
"backend-dev-guidelines": {
  "triggers": {
    "files": ["**/*.go", "cmd/**/*", "internal/**/*"]
  }
}
```

### 3d. Install Hook Dependencies
```bash
cd .claude/hooks && npm install
```

---

## Step 4: Update CLAUDE.md

Create or update the project's `CLAUDE.md` with detected stack info:

```markdown
## Stack Reference
- Runtime: [detected]
- Framework: [detected]
- Database: [detected]
- Language: [detected]
```

---

## Step 5: Verify Setup

```bash
# Check structure
ls -la .claude/

# Verify hooks installed
ls .claude/hooks/node_modules/

# Test skill activation (mention a trigger word)
```

---

## Quick Reference: Stack Adaptations

| Original (Next.js) | Python Equivalent | Go Equivalent |
|--------------------|-------------------|---------------|
| `app/api/**/*` | `api/**/*.py` | `cmd/**/*.go` |
| `components/**/*` | `templates/**/*` | N/A |
| `services/**/*` | `services/**/*.py` | `internal/**/*.go` |
| `*.tsx` | `*.py` | `*.go` |
| `middleware.ts` | `middleware.py` | `middleware.go` |

---

## Notes

- Skills are designed to be stack-agnostic in their methodology
- Only file patterns and specific syntax examples need adaptation
- The hook system (skill-rules.json) works for any language
- Consider creating stack-specific skill variants for heavily-used stacks
