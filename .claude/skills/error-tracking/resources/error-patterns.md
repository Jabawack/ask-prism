# Error Patterns

## API Route Error Handling

### Standard Pattern
```typescript
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Validate input
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      throw new ValidationError('ID is required');
    }

    // Execute operation
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();

    // Handle database errors
    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Item');
      }
      throw new DatabaseError(error.message);
    }

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Auth Check Pattern
```typescript
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new AuthError();
    }

    // Then business logic
    const body = await request.json();
    // ...
  } catch (error) {
    return handleApiError(error);
  }
}
```

## Common Error Scenarios

### Validation Errors
```typescript
// Using Zod
try {
  const validated = Schema.parse(body);
} catch (error) {
  if (error instanceof z.ZodError) {
    throw new ValidationError('Invalid input', error.errors);
  }
  throw error;
}
```

### Database Errors
```typescript
const { data, error } = await supabase.from('users').insert(userData);

if (error) {
  // Duplicate key
  if (error.code === '23505') {
    throw new ConflictError('User already exists');
  }
  // Foreign key violation
  if (error.code === '23503') {
    throw new ValidationError('Referenced record does not exist');
  }
  // Generic database error
  throw new DatabaseError(error.message);
}
```

### Not Found
```typescript
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', id)
  .single();

if (error?.code === 'PGRST116' || !data) {
  throw new NotFoundError('User');
}
```

## Async Error Handling

### Promise.all with Error Collection
```typescript
async function processItems(items: Item[]) {
  const results = await Promise.allSettled(
    items.map(item => processItem(item))
  );

  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map(r => r.reason);

  if (errors.length > 0) {
    logger.error('Some items failed', { errorCount: errors.length, errors });
  }

  return results
    .filter((r): r is PromiseFulfilledResult<ProcessedItem> => r.status === 'fulfilled')
    .map(r => r.value);
}
```

### Retry Logic
```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn('Retry attempt', { attempt: attempt + 1, error: lastError.message });
      await new Promise(r => setTimeout(r, delay * Math.pow(2, attempt)));
    }
  }

  throw lastError;
}
```

## Client-Side Error Handling

### Fetch Wrapper
```typescript
async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}
```

### React Query Error Handling
```typescript
const { data, error, isError } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => apiFetch(`/api/users/${userId}`),
  retry: (failureCount, error) => {
    // Don't retry 4xx errors
    if (error.message.includes('not found')) return false;
    return failureCount < 3;
  },
});

if (isError) {
  return <ErrorDisplay message={error.message} />;
}
```

## Error Reporting

### To Console (Development)
```typescript
if (process.env.NODE_ENV === 'development') {
  console.error('Full error:', error);
  console.error('Stack:', error.stack);
}
```

### To Monitoring Service
```typescript
// lib/monitoring.ts
export function reportError(error: Error, context?: Record<string, unknown>) {
  // Sentry example
  // Sentry.captureException(error, { extra: context });

  // Or custom logging
  logger.error(error.message, {
    stack: error.stack,
    ...context,
  });
}
```
