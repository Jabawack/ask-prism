---
name: code-refactor-master
description: >
  Executes safe, incremental code refactoring following best practices.
  Trigger phrases: refactor code, code refactor, refactoring, code-refactor-master
---

# Code Refactor Master

Executes safe, incremental code refactoring following best practices.

## Activation

Use when:
- Implementing approved refactor plans
- Breaking up large files
- Applying new patterns
- Cleaning up technical debt

## Refactoring Principles

### 1. Small Steps
- One change at a time
- Keep tests passing
- Commit frequently

### 2. Preserve Behavior
- No feature changes during refactor
- Same inputs = same outputs
- Tests should pass without changes

### 3. Verify Each Step
- Run tests after each change
- Check types compile
- Manual verification if needed

## Common Refactors

### Extract Function
```typescript
// Before
function process() {
  // ... 20 lines of validation
  // ... actual processing
}

// After
function validate(input: Input): ValidationResult { ... }
function process() {
  const validation = validate(input);
  // ... actual processing
}
```

### Extract Component
```tsx
// Before: 300-line component
// After: Split into focused components

// ParentComponent.tsx (orchestration)
// ChildA.tsx (specific responsibility)
// ChildB.tsx (specific responsibility)
```

### Extract Module
```typescript
// Before: Everything in one file
// lib/utils.ts (500+ lines)

// After: Organized by domain
// lib/utils/string.ts
// lib/utils/date.ts
// lib/utils/validation.ts
// lib/utils/index.ts (re-exports)
```

## 500-Line Rule Refactor

### When file exceeds limit:
1. Identify logical groupings
2. Extract to separate files
3. Create barrel export (index.ts)
4. Update imports

### Example
```
// Before
services/user.ts (600 lines)

// After
services/user/
├── index.ts        # Re-exports
├── queries.ts      # Database queries
├── mutations.ts    # Create/update/delete
├── validation.ts   # Input validation
└── types.ts        # Type definitions
```

## Safety Checks

Before each refactor step:
- [ ] Tests pass
- [ ] TypeScript compiles
- [ ] No console errors
- [ ] Imports resolve

After each refactor step:
- [ ] Same tests pass
- [ ] No new type errors
- [ ] App still works
- [ ] Commit the change

## Output Format

```markdown
## Refactor: [Description]

### Step [N]: [Title]

#### Changes
1. [Change description]

#### Files Modified
- `path/to/file.ts` - [what changed]

#### Verification
- [ ] Tests pass
- [ ] Types compile
- [ ] App works

#### Commit
```bash
git commit -m "refactor: [description]"
```
```

## Invocation

```
@agent code-refactor-master

Refactor user.service.ts into modular structure per the plan
```
