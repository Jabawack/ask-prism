# API Testing

## Setup

```bash
npm install -D vitest @testing-library/react msw
```

## Test Structure

```
__tests__/
├── api/
│   ├── users.test.ts
│   └── auth.test.ts
├── services/
│   └── user.service.test.ts
└── setup.ts
```

## Testing API Routes

```typescript
// __tests__/api/users.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '@/app/api/users/route';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: '1', email: 'test@test.com', name: 'Test' },
        error: null,
      }),
    })),
  })),
}));

describe('GET /api/users', () => {
  it('returns users list', async () => {
    const request = new NextRequest('http://localhost/api/users');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('data');
  });

  it('handles pagination', async () => {
    const request = new NextRequest('http://localhost/api/users?page=2&limit=5');
    const response = await GET(request);

    expect(response.status).toBe(200);
  });
});

describe('POST /api/users', () => {
  it('creates user with valid data', async () => {
    const request = new NextRequest('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({ email: 'new@test.com', name: 'New User' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
  });

  it('rejects invalid email', async () => {
    const request = new NextRequest('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid', name: 'Test' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
```

## Testing Services

```typescript
// __tests__/services/user.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '@/services/user.service';
import { NotFoundError } from '@/lib/errors';

vi.mock('@/lib/supabase/server');

describe('UserService', () => {
  describe('getById', () => {
    it('returns user when found', async () => {
      const user = await UserService.getById('123');
      expect(user).toBeDefined();
      expect(user.id).toBe('123');
    });

    it('throws NotFoundError when not found', async () => {
      await expect(UserService.getById('nonexistent'))
        .rejects
        .toThrow(NotFoundError);
    });
  });
});
```

## Integration Tests with MSW

```typescript
// __tests__/setup.ts
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const server = setupServer(
  http.get('/api/users', () => {
    return HttpResponse.json({
      data: [{ id: '1', name: 'Test User' }],
    });
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ data: { id: '2', ...body } }, { status: 201 });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# Specific file
npm test -- __tests__/api/users.test.ts
```

## Test Utilities

```typescript
// __tests__/utils.ts
import { NextRequest } from 'next/server';

export function createMockRequest(
  url: string,
  options?: RequestInit
): NextRequest {
  return new NextRequest(`http://localhost${url}`, options);
}

export function createAuthenticatedRequest(
  url: string,
  options?: RequestInit
): NextRequest {
  return new NextRequest(`http://localhost${url}`, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: 'Bearer test-token',
    },
  });
}
```
