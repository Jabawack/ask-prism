# Skill Structure Guide

## Directory Layout

```
.claude/skills/[skill-name]/
├── SKILL.md              # Main entry point (max 500 lines)
├── resources/            # Supporting documentation
│   ├── core-concepts.md  # Foundational concepts
│   ├── patterns.md       # Code patterns and examples
│   ├── examples.md       # Real-world examples
│   ├── api-reference.md  # API documentation (if applicable)
│   └── troubleshooting.md # Common issues and solutions
└── templates/            # Optional: code templates
    └── *.template.ts
```

## SKILL.md Anatomy

### Required Sections
1. **Title** - Skill name as H1
2. **Description** - One-line summary
3. **Activation** - When/how skill activates
4. **Core Concepts** - Brief overview (link to resources)
5. **Commands** - Available slash commands
6. **Resources** - Links to resource files

### Optional Sections
- Quick Reference
- Configuration
- Integration Points
- Related Skills

## Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Skill folder | kebab-case | `error-tracking` |
| SKILL.md | UPPERCASE | `SKILL.md` |
| Resources | kebab-case | `core-concepts.md` |
| Templates | kebab-case.template.ext | `component.template.tsx` |

## Line Count Guidelines

| File Type | Target | Maximum |
|-----------|--------|---------|
| SKILL.md | 200-300 | 500 |
| Resource file | 100-200 | 400 |
| Template | 50-100 | 200 |

## Cross-Skill References

Use relative paths when referencing other skills:
```markdown
See also: [Backend Guidelines](../backend-dev-guidelines/SKILL.md)
```

## Versioning

Include version in skill-rules.json for tracking:
```json
"skill-name": {
  "version": "1.0.0",
  ...
}
```
