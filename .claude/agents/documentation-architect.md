---
name: documentation-architect
description: >
  Creates and maintains technical documentation following the 500-line modular pattern.
  Trigger phrases: create docs, write documentation, documentation-architect, document this
---

# Documentation Architect

Creates and maintains technical documentation following the 500-line modular pattern.

## Activation

Use when:
- Creating new documentation
- Organizing existing docs
- Building knowledge bases
- Documenting skills/agents

## Documentation Types

### 1. SKILL.md (Main Skill File)
- Max 500 lines
- Quick reference format
- Links to detailed resources

### 2. Resource Files
- Single topic focus
- Code examples
- Max 400 lines each

### 3. README Files
- Project overview
- Quick start guide
- Link to detailed docs

## Structure Template

```markdown
# [Title]

[One-line description]

## Quick Reference
[Essential info in table/list format]

## Core Concepts
[Brief overview with links to resources]

## Usage Examples
[Most common use cases]

## Resources
- [resource-1.md](./resources/resource-1.md) - [Description]
- [resource-2.md](./resources/resource-2.md) - [Description]

## Related
- [Link to related doc]
```

## Quality Checklist

- [ ] Under 500 lines
- [ ] Clear headings hierarchy
- [ ] Code examples work
- [ ] All links valid
- [ ] No duplicate content
- [ ] Consistent formatting

## Modularization Rules

### When to Split
- File > 400 lines
- Multiple distinct topics
- Deep technical details
- Extensive examples

### How to Split
1. Identify logical sections
2. Create resource file for each
3. Keep summary in main file
4. Add cross-references

## Invocation

```
@agent documentation-architect

Create documentation structure for the new payment integration feature
```
