# Logging Best Practices

## Logger Setup

### Basic Logger
```typescript
// lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatLog(level: LogLevel, message: string, context?: LogContext) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  });
}

export const logger = {
  debug: (message: string, context?: LogContext) => {
    if (shouldLog('debug')) {
      console.debug(formatLog('debug', message, context));
    }
  },
  info: (message: string, context?: LogContext) => {
    if (shouldLog('info')) {
      console.log(formatLog('info', message, context));
    }
  },
  warn: (message: string, context?: LogContext) => {
    if (shouldLog('warn')) {
      console.warn(formatLog('warn', message, context));
    }
  },
  error: (message: string, context?: LogContext) => {
    if (shouldLog('error')) {
      console.error(formatLog('error', message, context));
    }
  },
};
```

## Structured Logging

### Good Practices
```typescript
// Include relevant context
logger.info('User logged in', {
  userId: user.id,
  method: 'email',
  ip: request.headers.get('x-forwarded-for'),
});

// Include timing
const start = Date.now();
await doOperation();
logger.info('Operation completed', {
  operation: 'syncData',
  duration: Date.now() - start,
});

// Include error details
logger.error('Database query failed', {
  query: 'SELECT * FROM users',
  error: err.message,
  code: err.code,
});
```

### What to Log

#### Always Log
- Authentication events (login, logout, failed attempts)
- Authorization failures
- API errors (with context)
- Performance issues (slow queries)
- Critical business events

#### Log with Care
- User input (sanitize PII)
- Request bodies (exclude sensitive data)
- Response data (summarize large payloads)

#### Never Log
- Passwords
- API keys
- Credit card numbers
- Personal identifiable information (PII)

## Request Logging

### API Route Logging
```typescript
// lib/api/with-logging.ts
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

export function withLogging(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const start = Date.now();
    const requestId = crypto.randomUUID();

    logger.info('Request started', {
      requestId,
      method: request.method,
      path: request.nextUrl.pathname,
    });

    try {
      const response = await handler(request);

      logger.info('Request completed', {
        requestId,
        status: response.status,
        duration: Date.now() - start,
      });

      return response;
    } catch (error) {
      logger.error('Request failed', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - start,
      });
      throw error;
    }
  };
}

// Usage
export const GET = withLogging(async (request) => {
  // handler logic
});
```

## Log Levels Guide

| Level | Use For | Example |
|-------|---------|---------|
| `debug` | Development details | Variable values, flow tracing |
| `info` | Normal operations | User actions, API calls |
| `warn` | Potential issues | Deprecated usage, retries |
| `error` | Failures | Exceptions, failed operations |

## Production Logging

### Environment Configuration
```bash
# .env.production
LOG_LEVEL=info

# .env.development
LOG_LEVEL=debug
```

### Sensitive Data Handling
```typescript
function sanitizeForLog(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization'];
  const sanitized = { ...obj };

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}

// Usage
logger.info('Request received', sanitizeForLog(requestBody));
```

## Log Aggregation

For production, consider integrating with:
- **Vercel Logs** - Built-in for Vercel deployments
- **LogDNA** - Cloud log management
- **Datadog** - Full observability platform
- **Sentry** - Error tracking with context

```typescript
// Example: Send to external service
if (process.env.NODE_ENV === 'production') {
  // Send to log aggregation service
  await fetch('https://logs.example.com', {
    method: 'POST',
    body: JSON.stringify(logEntry),
  });
}
```
