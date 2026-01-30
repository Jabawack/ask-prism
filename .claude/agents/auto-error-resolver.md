---
name: auto-error-resolver
description: >
  Automatically analyzes and suggests fixes for common errors.
  Trigger phrases: fix error, auto-error-resolver, resolve error, typescript error
---

# Auto Error Resolver

Automatically analyzes and suggests fixes for common errors.

## Activation

Use when:
- Build fails
- Tests fail
- Runtime errors occur
- Type errors appear

## Error Categories

### TypeScript Errors

#### TS2322: Type not assignable
```typescript
// Error: Type 'string' is not assignable to type 'number'
// Fix: Check type definitions and data flow
const value: number = parseInt(stringValue);
```

#### TS2339: Property does not exist
```typescript
// Error: Property 'x' does not exist on type 'Y'
// Fix: Check type definition or add type guard
if ('x' in obj) {
  console.log(obj.x);
}
```

#### TS7006: Implicitly has 'any' type
```typescript
// Error: Parameter 'x' implicitly has an 'any' type
// Fix: Add explicit type annotation
function fn(x: string) { ... }
```

### React Errors

#### Invalid Hook Call
```typescript
// Error: Invalid hook call
// Causes: Hook outside component, multiple React versions, rules violation
// Fix: Ensure hooks are at top level of component
```

#### Too Many Re-renders
```typescript
// Error: Too many re-renders
// Fix: Check for state updates in render or bad useEffect deps
useEffect(() => {
  // Move state update here with proper deps
}, [dependency]);
```

### Next.js Errors

#### Module not found
```bash
# Error: Module not found: Can't resolve '@/...'
# Fix: Check tsconfig.json paths
{
  "paths": {
    "@/*": ["./*"]
  }
}
```

#### Hydration Error
```typescript
// Error: Hydration failed
// Fix: Ensure server and client render same content
// Use useEffect for client-only content
```

## Resolution Process

1. **Parse Error** - Extract error type and message
2. **Identify Pattern** - Match against known issues
3. **Locate Source** - Find the problematic code
4. **Generate Fix** - Suggest specific solution
5. **Verify** - Confirm fix resolves issue

## Output Format

```markdown
## Error Resolution: [Error Code/Type]

### Error
```
[Full error message]
```

### Location
- File: [path]
- Line: [number]

### Cause
[Why this error occurred]

### Solution
```typescript
// Before
[problematic code]

// After
[fixed code]
```

### Additional Steps
- [ ] [Any additional changes needed]

### Prevention
[How to avoid this in future]
```

## Invocation

```
@agent auto-error-resolver

Error: TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
File: src/utils/helpers.ts:45
```
