# Error Tracking

Error handling, logging, debugging, and monitoring patterns for Next.js applications.

## Activation

This skill activates when you:
- Mention: error, bug, fix, debug, crash, exception, log
- Work with error handling code, logging utilities
- Need to investigate or resolve errors

## Quick Reference

### Error Classification

| Type | Status Code | Example |
|------|-------------|---------|
| Validation | 400 | Invalid input data |
| Authentication | 401 | Missing or invalid token |
| Authorization | 403 | No permission |
| Not Found | 404 | Resource doesn't exist |
| Conflict | 409 | Duplicate entry |
| Server Error | 500 | Unexpected failure |

### Standard Error Response
```json
{
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE",
  "details": []
}
```

## Error Handling Setup

### Error Classes
```typescript
// lib/errors/index.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTH_ERROR');
  }
}
```

### API Error Handler
```typescript
// lib/api/error-handler.ts
import { NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';
import { ZodError } from 'zod';

export function handleApiError(error: unknown) {
  // Log for debugging
  console.error('[API Error]', error);

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { error: 'Internal server error', code: 'INTERNAL_ERROR' },
    { status: 500 }
  );
}
```

### Usage in Routes
```typescript
export async function GET(request: NextRequest) {
  try {
    // ... route logic
  } catch (error) {
    return handleApiError(error);
  }
}
```

## Frontend Error Handling

### Error Boundary
```tsx
// components/ErrorBoundary.tsx
'use client';
import { Component, ReactNode } from 'react';
import { Alert, Button, Box } from '@mui/material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error caught:', error, info);
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Box p={4}>
          <Alert severity="error">
            Something went wrong. Please try again.
          </Alert>
          <Button onClick={() => this.setState({ hasError: false })}>
            Retry
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
```

### Next.js Error Page
```tsx
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## Logging

### Logger Setup
```typescript
// lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) =>
    log('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) =>
    log('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) =>
    log('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) =>
    log('error', message, context),
};

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };

  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}
```

### Structured Logging
```typescript
logger.info('User logged in', { userId: '123', method: 'email' });
logger.error('Database query failed', { table: 'users', error: err.message });
```

## Debugging Tips

### 1. Check Console Logs
```bash
# Terminal running dev server shows server-side logs
npm run dev

# Browser console shows client-side logs
```

### 2. Add Context
```typescript
try {
  await supabase.from('users').insert(data);
} catch (error) {
  logger.error('Failed to create user', {
    input: data,
    error: error instanceof Error ? error.message : String(error),
  });
  throw error;
}
```

### 3. Use Error Codes
```typescript
// Easy to search and track
throw new AppError('User not found', 404, 'USER_NOT_FOUND');
```

## Commands

- `/error-tracking` - Activate this skill
- `/error-tracking:debug [error]` - Get debugging suggestions

## Resources

See `resources/` for:
- `error-patterns.md` - Common error handling patterns
- `logging.md` - Logging best practices
- `debugging.md` - Debugging techniques

## Related Skills

- [Backend Guidelines](../backend-dev-guidelines/SKILL.md) - API error handling
- [Route Tester](../route-tester/SKILL.md) - Testing error cases
