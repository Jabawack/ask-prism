---
name: date-aware
description: >
  Ensures accurate date/time usage for date-sensitive tasks.
  Trigger phrases: date-aware, check date, current date, what year, documentation date
user-invocable: true
---

# Date-Aware Skill

Ensures accurate date/time usage for documentation, changelogs, research, and other date-sensitive tasks.

## Activation

This skill activates when:
- Writing or updating documentation
- Creating changelogs or release notes
- Researching current information
- Any task requiring accurate dates
- User says "check date" or "date-aware"

## Configuration

Disable via environment variable:
```bash
export SKIP_DATE_SKILL=1
```

## Before Any Date-Sensitive Task

**ALWAYS verify the current date first:**

```bash
date '+%Y-%m-%d %H:%M %Z'
```

## Rules

1. **Never assume dates** - Always check system time
2. **Use current year** - As of this writing: 2026
3. **Don't trust training data dates** - Training cutoff may be outdated
4. **Verify before documenting** - Run `date` command if unsure

## Date-Sensitive Tasks

| Task Type | Action |
|-----------|--------|
| Documentation | Use current date for "last updated" |
| Changelogs | Use current date for entries |
| Research | Search for current year information |
| Version notes | Use current date |
| Comments | Use current date if timestamping |

## Output Format

When providing dates, use ISO 8601 format:
- Date: `2026-01-17`
- DateTime: `2026-01-17T14:30:00Z`
- Year-Month: `2026-01`

## Commands

- `/date-aware` - Activate this skill manually
- `/date-aware:check` - Output current system date

## Integration

This skill works with:
1. **CLAUDE.md rule** - Always-on reminder
2. **date-injection hook** - Auto-injects date into prompts
3. **This skill** - Extra enforcement for date-critical tasks

## Quick Reference

```
Current date check: date '+%Y-%m-%d %H:%M %Z'
ISO format:         date -u '+%Y-%m-%dT%H:%M:%SZ'
Year only:          date '+%Y'
```
