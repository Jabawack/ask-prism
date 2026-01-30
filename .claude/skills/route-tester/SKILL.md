# Route Tester

API endpoint testing, integration tests, and route validation for Next.js API routes with Supabase.

## Activation

This skill activates when you:
- Mention: test route, test api, test endpoint, integration test
- Work with `__tests__/api/**/*`, `*.test.ts`, `*.spec.ts`
- Need to validate API functionality

## Quick Reference

### Test API Route Manually
```bash
# GET request
curl http://localhost:3000/api/users

# GET with query params
curl "http://localhost:3000/api/users?page=1&limit=10"

# POST with JSON body
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'

# PUT with authentication
curl -X PUT http://localhost:3000/api/users/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Updated Name"}'

# DELETE
curl -X DELETE http://localhost:3000/api/users/123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Response Expectations
```typescript
// Expected success response
{
  "data": { ... }
}

// Expected error response
{
  "error": "Error message",
  "code": "ERROR_CODE"
}

// Expected list response
{
  "data": [...],
  "pagination": { "page": 1, "limit": 10, "total": 100 }
}
```

## Testing Workflow

### 1. Identify Endpoint
```
Method: POST
Path: /api/users
Auth: Required
Body: { email, name }
```

### 2. Test Happy Path
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"email":"test@example.com","name":"Test"}'
```

### 3. Test Edge Cases
- Missing required fields
- Invalid field formats
- Unauthorized requests
- Non-existent resources
- Duplicate entries

### 4. Verify Database State
```sql
-- Check in Supabase SQL Editor
SELECT * FROM users WHERE email = 'test@example.com';
```

## Automated Testing

### Vitest Setup
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

### Route Test Template
```typescript
// __tests__/api/users.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/users/route';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  })),
}));

describe('GET /api/users', () => {
  it('returns 200 with users list', async () => {
    const request = new NextRequest('http://localhost:3000/api/users');
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toHaveProperty('data');
  });
});

describe('POST /api/users', () => {
  it('returns 201 on successful creation', async () => {
    const request = new NextRequest('http://localhost:3000/api/users', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', name: 'Test' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
  });

  it('returns 400 on invalid data', async () => {
    const request = new NextRequest('http://localhost:3000/api/users', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
```

## Auth Testing

### Get Test Token
```typescript
// scripts/get-test-token.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getTestToken() {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: 'test@example.com',
  });
  console.log('Token:', data?.properties?.access_token);
}
```

### Test Protected Route
```bash
# Without auth (should fail)
curl http://localhost:3000/api/protected/resource
# Expected: {"error":"Unauthorized"}

# With auth (should succeed)
curl http://localhost:3000/api/protected/resource \
  -H "Authorization: Bearer $TOKEN"
```

## Commands

- `/route-tester` - Activate this skill
- `/route-tester:test [method] [path]` - Generate test command
- `/route-tester:coverage` - Show route test coverage

## Resources

See `resources/` for:
- `curl-examples.md` - Common curl patterns
- `test-patterns.md` - Testing patterns and mocking
- `auth-testing.md` - Authentication testing strategies

## Related Skills

- [Backend Guidelines](../backend-dev-guidelines/SKILL.md) - API implementation
- [Error Tracking](../error-tracking/SKILL.md) - Error handling tests
