# /setup-hooks

Complete setup for Claude Code infrastructure with Next.js project.

## Usage

```
/setup-hooks
```

## Setup Steps (Claude follows these in order)

### Step 1: Ask User Preferences

Use AskUserQuestion to gather:

1. **Project/Repo Name**: Show current folder name and ask to confirm or change
   - Default: current folder name via `basename "$PWD"`
   - User can type a different name if they want

2. **Language**: TypeScript (recommended) or JavaScript

### Step 2: Install Hook Dependencies

```bash
cd .claude/hooks && npm install && cd -
```

### Step 3: Backup Existing Files

`create-next-app` requires an empty directory. Backup template files first:

```bash
mkdir -p /tmp/claude-setup-backup
mv .claude /tmp/claude-setup-backup/
[ -f CLAUDE.md ] && mv CLAUDE.md /tmp/claude-setup-backup/
[ -f README.md ] && mv README.md /tmp/claude-setup-backup/
[ -d dev ] && mv dev /tmp/claude-setup-backup/
[ -d docs ] && mv docs /tmp/claude-setup-backup/
[ -f .gitignore ] && mv .gitignore /tmp/claude-setup-backup/
rm -rf .git
```

### Step 4: Create Next.js Project

**Always answer "No" to React Compiler** (experimental, not production-ready).

For TypeScript (default):
```bash
echo "No" | npx create-next-app@latest . --typescript --src-dir --app --tailwind --eslint --import-alias "@/*" --use-npm --no-turbopack
```

For JavaScript:
```bash
echo "No" | npx create-next-app@latest . --js --src-dir --app --tailwind --eslint --import-alias "@/*" --use-npm --no-turbopack
```

**Flags explained:**
- `echo "No" |` - Auto-answer "No" to React Compiler prompt
- `.` - Install in current directory (prevents nested folders!)
- `--src-dir` - Creates `src/app/` structure
- `--app` - Use App Router
- `--tailwind` - Include Tailwind CSS
- `--eslint` - Include ESLint
- `--use-npm` - Use npm
- `--no-turbopack` - Use webpack (more stable)

### Step 5: Restore Backed Up Files

```bash
mv /tmp/claude-setup-backup/.claude ./
[ -f /tmp/claude-setup-backup/CLAUDE.md ] && mv /tmp/claude-setup-backup/CLAUDE.md ./
[ -d /tmp/claude-setup-backup/dev ] && mv /tmp/claude-setup-backup/dev ./
[ -d /tmp/claude-setup-backup/docs ] && mv /tmp/claude-setup-backup/docs ./
rm -rf /tmp/claude-setup-backup
```

Note: Keep Next.js generated README.md and .gitignore (they have useful content).

### Step 6: Initialize Fresh Git Repository

`create-next-app` runs `git init` automatically. Stage all files so user can commit immediately:

```bash
# Stage all files
git add .

# Show user the status
git status
```

Use the **confirmed project name from Step 1** for the commit message suggestion.

### Step 7: Verify Structure

Confirm the structure is correct (NOT `app/src/app/`):

```
project-root/
├── .claude/           # Skills, hooks, agents (restored)
├── src/
│   └── app/           # Next.js App Router
│       ├── layout.tsx (or .js)
│       ├── page.tsx (or .js)
│       └── globals.css
├── public/
├── CLAUDE.md          # Project instructions (restored)
├── package.json
├── next.config.mjs
└── tsconfig.json      # (TypeScript only)
```

### Step 8: Report Completion

Tell the user (use confirmed project name from Step 1):
```
Setup complete!

Structure: src/app/ (correct)
Git: All files staged, ready to commit

Next steps:
  git commit -m "Initial commit: <project-name>"
  git remote add origin <your-repo-url>
  git push -u origin main

Start dev server:
  npm run dev
```

## Troubleshooting

### Nested `app/src/app/` structure
This should NOT happen with `.` flag. If it does:
```bash
mv app/* ./ && rm -rf app/
```

### React Compiler prompt
Always "No" - handled automatically via `echo "No" |` pipe.
