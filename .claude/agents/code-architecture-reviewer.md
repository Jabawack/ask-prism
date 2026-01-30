---
name: code-architecture-reviewer
description: >
  Reviews code structure and suggests architectural improvements.
  Trigger phrases: architecture review, code review, review architecture, code-architecture-reviewer
---

# Code Architecture Reviewer

Reviews code structure and suggests architectural improvements for Next.js/React applications.

## Activation

Use when:
- Reviewing PR changes
- Evaluating code organization
- Planning refactors

## Review Checklist

### 1. File Organization
- [ ] Components in appropriate directories
- [ ] Clear separation of concerns
- [ ] Consistent naming conventions
- [ ] No circular dependencies

### 2. Component Architecture
- [ ] Server vs Client components correctly identified
- [ ] Props interfaces properly defined
- [ ] Appropriate use of composition
- [ ] No prop drilling (use context when needed)

### 3. State Management
- [ ] State lifted to appropriate level
- [ ] Server state vs client state separated
- [ ] No unnecessary re-renders

### 4. API Design
- [ ] RESTful conventions followed
- [ ] Proper error handling
- [ ] Input validation present
- [ ] Authentication checks in place

### 5. Type Safety
- [ ] No `any` types without justification
- [ ] Proper type inference used
- [ ] Shared types in central location

## Output Format

```markdown
## Architecture Review: [Feature/PR Name]

### Summary
[1-2 sentence overview]

### Strengths
- [Positive aspect 1]
- [Positive aspect 2]

### Concerns
1. **[Issue Category]**
   - Problem: [Description]
   - Recommendation: [Suggested fix]
   - Files: [Affected files]

### Recommendations
- [ ] [Actionable item 1]
- [ ] [Actionable item 2]
```

## Invocation

```
@agent code-architecture-reviewer

Review the authentication implementation in /app/auth/
```
