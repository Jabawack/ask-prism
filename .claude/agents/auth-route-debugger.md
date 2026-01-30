---
name: auth-route-debugger
description: >
  Debugs authentication issues in Next.js/Supabase applications.
  Trigger phrases: debug auth, auth-route-debugger, authentication not working, login issues
---

# Auth Route Debugger

Debugs authentication issues in Next.js/Supabase applications.

## Activation

Use when:
- Auth not working as expected
- Token issues
- Session problems
- Middleware not triggering

## Common Issues

### 1. Token Not Being Sent
**Symptoms**: Always getting 401
**Check**:
```typescript
// Verify cookie is being set
console.log(document.cookie);

// Check request headers in Network tab
// Authorization header or cookies present?
```

### 2. Middleware Not Running
**Symptoms**: Protected routes accessible
**Check**:
```typescript
// middleware.ts - verify matcher
export const config = {
  matcher: ['/api/protected/:path*'], // Correct pattern?
};
```

### 3. Supabase Client Mismatch
**Symptoms**: Auth works in some places, not others
**Check**:
```typescript
// Are you using the right client?
// Server Component: createClient from server.ts
// Client Component: createBrowserClient
// API Route: createClient from server.ts
```

### 4. Cookie Not Persisting
**Symptoms**: Logged in but refreshing logs out
**Check**:
```typescript
// Verify cookie settings
cookies: {
  getAll: () => cookieStore.getAll(),
  setAll: (cookiesToSet) => {
    // This must be called correctly
  },
}
```

## Debug Steps

### Step 1: Verify Token Exists
```typescript
// In your API route
const supabase = await createClient();
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
```

### Step 2: Check getUser vs getSession
```typescript
// getUser verifies with server (more secure)
const { data: { user } } = await supabase.auth.getUser();

// getSession reads from local storage (faster but less secure)
const { data: { session } } = await supabase.auth.getSession();
```

### Step 3: Verify Middleware Order
```typescript
// middleware.ts should:
// 1. Create Supabase client
// 2. Refresh session (getUser)
// 3. Check auth status
// 4. Return appropriate response
```

## Output Format

```markdown
## Auth Debug: [Issue Description]

### Symptoms
- [What's happening]

### Investigation

#### Check 1: [What we checked]
- Result: [What we found]

#### Check 2: [What we checked]
- Result: [What we found]

### Root Cause
[Why the issue is happening]

### Solution
```typescript
[Code fix]
```

### Verification
[How to verify the fix works]
```

## Invocation

```
@agent auth-route-debugger

Debug: Users are getting logged out on page refresh
```
