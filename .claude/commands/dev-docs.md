# /dev-docs

Generate or view development documentation for the current project.

## Usage

```
/dev-docs              # Show current dev docs
/dev-docs generate     # Generate dev docs for active feature
/dev-docs update       # Update existing dev docs
```

## Dev Docs Structure

Development documentation lives in `dev/active/[feature-name]/`:

```
dev/active/user-auth/
├── OVERVIEW.md        # Feature summary
├── PLAN.md            # Implementation plan
├── PROGRESS.md        # Current status
└── NOTES.md           # Working notes
```

## OVERVIEW.md Template

```markdown
# [Feature Name]

## Summary
[1-2 sentence description]

## Goals
- [ ] [Goal 1]
- [ ] [Goal 2]

## Non-Goals
- [What's explicitly out of scope]

## Technical Approach
[Brief technical description]

## Dependencies
- [Dependency 1]
- [Dependency 2]
```

## PLAN.md Template

```markdown
# Implementation Plan: [Feature]

## Phase 1: [Name]
- [ ] Task 1
- [ ] Task 2

## Phase 2: [Name]
- [ ] Task 1
- [ ] Task 2

## Risks
- [Risk and mitigation]

## Definition of Done
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Code reviewed
```

## PROGRESS.md Template

```markdown
# Progress: [Feature]

## Status: [In Progress / Blocked / Complete]

## Completed
- [x] [What's done]

## In Progress
- [ ] [Current work]

## Blocked
- [Issue and what's needed]

## Next Steps
1. [Next task]
```

## Commands

| Command | Description |
|---------|-------------|
| `/dev-docs` | Show docs for current feature |
| `/dev-docs generate` | Create new feature docs |
| `/dev-docs update` | Update progress |
| `/dev-docs list` | List all active features |
