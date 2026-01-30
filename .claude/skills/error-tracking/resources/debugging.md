# Debugging Techniques

## Server-Side Debugging

### Console Logging
```typescript
// Basic logging
console.log('Variable value:', variable);

// Object inspection
console.log('User object:', JSON.stringify(user, null, 2));

// Conditional logging
if (process.env.DEBUG) {
  console.log('Debug info:', debugData);
}
```

### Environment-Based Debugging
```typescript
// lib/debug.ts
export const debug = {
  log: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG]', ...args);
    }
  },
  time: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.time(label);
    }
  },
  timeEnd: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.timeEnd(label);
    }
  },
};

// Usage
debug.time('fetchUsers');
const users = await fetchUsers();
debug.timeEnd('fetchUsers'); // fetchUsers: 123.456ms
```

### Request Debugging
```typescript
// Debug middleware
export async function middleware(request: NextRequest) {
  if (process.env.DEBUG_REQUESTS) {
    console.log('---Request Debug---');
    console.log('Method:', request.method);
    console.log('URL:', request.url);
    console.log('Headers:', Object.fromEntries(request.headers));
  }

  return NextResponse.next();
}
```

## Client-Side Debugging

### React DevTools
- Install React DevTools browser extension
- Inspect component tree
- View props and state
- Profile performance

### Console Methods
```typescript
// Group related logs
console.group('User Authentication');
console.log('Checking credentials...');
console.log('User found:', user);
console.groupEnd();

// Table for arrays/objects
console.table(users);

// Trace call stack
console.trace('Function called from:');

// Assert conditions
console.assert(user !== null, 'User should not be null');
```

### Debug State Changes
```typescript
'use client';
import { useEffect, useRef } from 'react';

function useDebugValue<T>(value: T, label: string) {
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      console.log(`[${label}] changed:`, {
        prev: prevValue.current,
        current: value,
      });
      prevValue.current = value;
    }
  }, [value, label]);
}

// Usage
function Component({ data }) {
  useDebugValue(data, 'Component.data');
  // ...
}
```

## Database Debugging

### Log Supabase Queries
```typescript
// Wrapper with logging
async function supabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  const start = Date.now();
  const { data, error } = await queryFn();

  if (process.env.DEBUG_DB) {
    console.log('DB Query:', {
      duration: Date.now() - start,
      hasData: !!data,
      error: error?.message,
    });
  }

  if (error) throw error;
  return data as T;
}

// Usage
const users = await supabaseQuery(() =>
  supabase.from('users').select('*')
);
```

### Supabase Dashboard
- Use SQL Editor for direct queries
- Check RLS policies
- View real-time logs

## Network Debugging

### Browser DevTools
1. Open Network tab
2. Filter by XHR/Fetch
3. Inspect request/response
4. Check timing waterfall

### Debug Fetch Requests
```typescript
// Wrapper with debugging
async function debugFetch(url: string, options?: RequestInit) {
  console.log('Fetch:', { url, ...options });

  const start = Date.now();
  const response = await fetch(url, options);
  const duration = Date.now() - start;

  console.log('Response:', {
    status: response.status,
    duration,
    headers: Object.fromEntries(response.headers),
  });

  return response;
}
```

## Error Investigation

### Error Stack Analysis
```typescript
try {
  await riskyOperation();
} catch (error) {
  if (error instanceof Error) {
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    console.error('Error name:', error.name);
  }
}
```

### Reproduce in Isolation
```typescript
// Create minimal reproduction
// 1. Extract the failing code
// 2. Remove unrelated dependencies
// 3. Add logging at each step
// 4. Identify the exact failure point

async function debugIssue() {
  console.log('Step 1: Fetching data...');
  const data = await fetchData();
  console.log('Step 1 result:', data);

  console.log('Step 2: Processing...');
  const processed = processData(data);
  console.log('Step 2 result:', processed);

  // Continue until error is found
}
```

## Performance Debugging

### Measure Execution Time
```typescript
// Using Performance API
const start = performance.now();
await heavyOperation();
const duration = performance.now() - start;
console.log(`Operation took ${duration.toFixed(2)}ms`);
```

### React Profiler
```tsx
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number
) {
  console.log(`${id} ${phase}: ${actualDuration.toFixed(2)}ms`);
}

<Profiler id="MyComponent" onRender={onRenderCallback}>
  <MyComponent />
</Profiler>
```

## Common Issues

### Hydration Mismatch
- Check for date/random values
- Verify server/client render same content
- Use `useEffect` for client-only code

### Stale Closure
- Check `useEffect` dependencies
- Use `useRef` for mutable values
- Verify callback dependencies

### Memory Leaks
- Clean up subscriptions in `useEffect` return
- Cancel pending requests on unmount
- Use proper cleanup patterns
