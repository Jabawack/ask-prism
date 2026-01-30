# Skill Development Best Practices

## Design Principles

### 1. Single Responsibility
Each skill should focus on one domain or concern.

**Good:** `error-tracking` - Handles error logging and monitoring
**Bad:** `error-and-perf-tracking` - Mixes concerns

### 2. Clear Activation
Users should understand when a skill will activate.

```json
// Good - Specific triggers
"prompt": ["api route", "endpoint", "rest api"]

// Bad - Too generic
"prompt": ["code", "help", "create"]
```

### 3. Progressive Disclosure
Start with essentials, link to details.

```markdown
## Quick Start
[Essential info - 10 lines]

## Details
See [Complete Guide](resources/complete-guide.md)
```

## Writing Guidelines

### Be Concise
- Use bullet points over paragraphs
- One concept per sentence
- Remove filler words

### Be Specific
```markdown
// Bad
"Handle errors properly"

// Good
"Wrap async operations in try-catch, log errors with context"
```

### Use Code Examples
```markdown
// Bad
"Create a component with state"

// Good
```tsx
const [count, setCount] = useState(0);
```
```

## Organization Tips

### Naming
- Use descriptive, lowercase, kebab-case names
- Skill name should describe its purpose
- Resource names should match their content

### Structure
- Keep related content together
- Use consistent section ordering
- Mirror folder structure in documentation

## Maintenance

### Regular Reviews
- Check line counts monthly
- Update outdated patterns
- Remove deprecated content

### Version Tracking
Update version when:
- Adding new features
- Changing structure
- Fixing significant issues

### Deprecation
When retiring a skill:
1. Mark as deprecated in SKILL.md
2. Point to replacement skill
3. Keep for 2 releases, then remove

## Testing Skills

### Activation Testing
1. Test all prompt triggers
2. Test all file triggers
3. Verify priority ordering
4. Check enforcement behavior

### Content Testing
1. Follow your own instructions
2. Test all code examples
3. Verify all links work
4. Check for outdated information

## Common Mistakes

### Avoid These
- Creating skills without updating skill-rules.json
- Mixing enforcement levels inconsistently
- Using overly broad trigger patterns
- Exceeding 500-line limit
- Missing resource file links

### Do These Instead
- Always update skill-rules.json
- Use consistent enforcement per skill type
- Use specific, tested trigger patterns
- Modularize proactively
- Link all resources from SKILL.md
