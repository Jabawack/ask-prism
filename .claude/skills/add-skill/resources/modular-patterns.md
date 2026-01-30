# Modular Patterns

## When to Modularize

### Signs You Need to Split
- File exceeds 500 lines
- Multiple distinct topics in one file
- Hard to find specific information
- Frequent scrolling to find content

### Modularization Triggers
| Current State | Action |
|---------------|--------|
| 400+ lines | Plan modularization |
| 500+ lines | Must modularize now |
| 3+ major sections | Consider splitting |

## Extraction Strategies

### By Topic
Split content by subject matter.

**Before:**
```markdown
# API Development
## Authentication
[100 lines]
## Database Patterns
[150 lines]
## Error Handling
[100 lines]
```

**After:**
```
SKILL.md (overview + quick reference)
resources/
├── authentication.md
├── database-patterns.md
└── error-handling.md
```

### By Depth
Keep summaries in SKILL.md, details in resources.

**Before:**
```markdown
## State Management
### Basic Concepts
[brief]
### Detailed Implementation
[extensive]
### Advanced Patterns
[extensive]
```

**After:**
```markdown
## State Management
[summary only, link to resources/state-management.md]
```

### By Use Case
Separate reference material from tutorials.

```
resources/
├── quick-reference.md   # Cheat sheet
├── tutorial.md          # Step-by-step guide
└── api-reference.md     # Complete API docs
```

## Linking Strategy

### From SKILL.md to Resources
```markdown
## Database Patterns

For complete database patterns, see [Database Patterns](resources/database-patterns.md).

**Quick Reference:**
- Use connection pooling
- Always use parameterized queries
- Handle connection errors gracefully
```

### Cross-Resource Links
```markdown
See also: [Authentication](./authentication.md) for secure patterns.
```

## Content Distribution

### SKILL.md Should Contain
- Skill overview and purpose
- Activation information
- Quick reference tables
- Command list
- Links to all resources

### Resources Should Contain
- Detailed explanations
- Complete code examples
- Step-by-step tutorials
- Edge cases and exceptions
- Troubleshooting guides

## Maintaining Coherence

### Consistent Headers
Use same header structure across resource files:
1. Overview
2. Key Concepts
3. Implementation
4. Examples
5. Common Issues

### Cross-References
Add "Related" section at bottom of each resource:
```markdown
## Related
- [Other Resource](./other.md)
- [Parent Skill](../SKILL.md)
```
