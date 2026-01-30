# Test Patterns

## Mocking Supabase

### Basic Mock
```typescript
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
  })),
  auth: {
    getUser: vi.fn(),
  },
};
```

### Mock with Dynamic Returns
```typescript
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom.mockReturnValue({
      select: mockSelect.mockReturnThis(),
      single: mockSingle,
    }),
  })),
}));

// In test
beforeEach(() => {
  mockSingle.mockResolvedValue({
    data: { id: '1', name: 'Test' },
    error: null,
  });
});

it('handles not found', async () => {
  mockSingle.mockResolvedValue({
    data: null,
    error: { code: 'PGRST116', message: 'Not found' },
  });

  const response = await GET(request);
  expect(response.status).toBe(404);
});
```

## Testing Authentication

### Mock Authenticated User
```typescript
const mockGetUser = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => ({ /* ... */ })),
  })),
}));

describe('protected route', () => {
  it('returns 401 when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it('returns data when authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@test.com' } },
      error: null,
    });

    const response = await GET(request);
    expect(response.status).toBe(200);
  });
});
```

## Request Helpers

```typescript
// __tests__/helpers.ts
import { NextRequest } from 'next/server';

export function createRequest(
  path: string,
  options?: {
    method?: string;
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  }
): NextRequest {
  const url = new URL(`http://localhost:3000${path}`);

  if (options?.searchParams) {
    Object.entries(options.searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return new NextRequest(url, {
    method: options?.method || 'GET',
    body: options?.body ? JSON.stringify(options.body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}

// Usage
const request = createRequest('/api/users', {
  method: 'POST',
  body: { email: 'test@test.com', name: 'Test' },
  headers: { Authorization: 'Bearer token' },
});
```

## Response Assertions

```typescript
async function expectJsonResponse(
  response: Response,
  status: number,
  bodyMatcher?: Record<string, unknown>
) {
  expect(response.status).toBe(status);

  const json = await response.json();
  if (bodyMatcher) {
    expect(json).toMatchObject(bodyMatcher);
  }
  return json;
}

// Usage
it('returns created user', async () => {
  const response = await POST(request);
  await expectJsonResponse(response, 201, {
    data: { email: 'test@test.com' },
  });
});
```

## Testing Validation

```typescript
describe('validation', () => {
  const invalidCases = [
    { body: {}, expected: 'email' },
    { body: { email: 'invalid' }, expected: 'email' },
    { body: { email: 'test@test.com' }, expected: 'name' },
  ];

  invalidCases.forEach(({ body, expected }) => {
    it(`rejects missing/invalid ${expected}`, async () => {
      const request = createRequest('/api/users', {
        method: 'POST',
        body,
      });
      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toContain('validation');
    });
  });
});
```

## Testing Pagination

```typescript
describe('pagination', () => {
  it('uses default pagination', async () => {
    const request = createRequest('/api/users');
    await GET(request);

    expect(mockRange).toHaveBeenCalledWith(0, 9); // page 1, limit 10
  });

  it('respects custom pagination', async () => {
    const request = createRequest('/api/users', {
      searchParams: { page: '2', limit: '5' },
    });
    await GET(request);

    expect(mockRange).toHaveBeenCalledWith(5, 9); // page 2, limit 5
  });
});
```
