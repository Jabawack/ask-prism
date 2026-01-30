---
name: frontend-error-fixer
description: >
  Diagnoses and fixes React/Next.js frontend errors quickly.
  Trigger phrases: fix frontend error, react error, frontend-error-fixer, hydration error
---

# Frontend Error Fixer

Diagnoses and fixes React/Next.js frontend errors quickly.

## Activation

Use when:
- Console shows React errors
- Components not rendering
- Hydration mismatches
- State/prop issues

## Diagnostic Process

### 1. Identify Error Type

| Error | Common Cause |
|-------|--------------|
| Hydration mismatch | Server/client content differs |
| Invalid hook call | Hook called conditionally |
| Cannot read property | Null/undefined access |
| Maximum update depth | Infinite re-render loop |
| Objects not valid as child | Rendering object instead of string |

### 2. Gather Context
- Full error message
- Component stack trace
- Recent changes
- Browser vs server error

### 3. Apply Fix Pattern

## Common Fixes

### Hydration Mismatch
```tsx
// Problem: Date/random values differ server vs client
// Fix: Use useEffect for client-only values
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null; // or skeleton
```

### Conditional Hook
```tsx
// Problem: Hook called after early return
// Fix: Always call hooks at top level
const data = useSWR(key, fetcher);
if (condition) return null; // Move AFTER hooks
```

### Infinite Loop
```tsx
// Problem: State update in render or useEffect deps
// Fix: Check useEffect dependencies
useEffect(() => {
  setData(transformData(props)); // Don't include setData in deps
}, [props]); // Only external deps
```

## Output Format

```markdown
## Error Fix: [Error Type]

### Diagnosis
- **Error**: [Exact error message]
- **Location**: [File:line]
- **Root Cause**: [Why it happened]

### Solution
[Code fix with explanation]

### Prevention
[How to avoid in future]
```

## Invocation

```
@agent frontend-error-fixer

Fix: "Hydration failed because the initial UI does not match"
Component: UserProfile.tsx
```
