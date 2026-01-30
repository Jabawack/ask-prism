# Authentication Testing

## Supabase Auth Testing

### Get Test Token

#### Via Supabase Dashboard
1. Go to Authentication > Users
2. Click on test user
3. Copy access token from session

#### Via Code
```typescript
// scripts/get-test-token.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getTestToken() {
  // Sign in as test user
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'testpassword123',
  });

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log('Access Token:', data.session?.access_token);
  console.log('Expires:', new Date(data.session?.expires_at! * 1000));
}

getTestToken();
```

### Test Protected Routes

#### Without Authentication
```bash
# Should return 401 Unauthorized
curl http://localhost:3000/api/protected/resource

# Expected response
# {"error":"Unauthorized","code":"AUTH_ERROR"}
```

#### With Valid Token
```bash
TOKEN="eyJhbGciOiJIUzI1NiIs..."

curl http://localhost:3000/api/protected/resource \
  -H "Authorization: Bearer $TOKEN"

# Expected response
# {"data":{...}}
```

#### With Invalid Token
```bash
curl http://localhost:3000/api/protected/resource \
  -H "Authorization: Bearer invalid-token"

# Expected response
# {"error":"Invalid token","code":"AUTH_ERROR"}
```

#### With Expired Token
```bash
# Use an expired token
curl http://localhost:3000/api/protected/resource \
  -H "Authorization: Bearer expired-token"

# Expected response
# {"error":"Token expired","code":"AUTH_ERROR"}
```

## Role-Based Access Testing

### Test User Role Access
```bash
# User trying to access user route (should succeed)
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer $USER_TOKEN"

# User trying to access admin route (should fail)
curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer $USER_TOKEN"

# Expected response
# {"error":"Permission denied","code":"AUTHORIZATION_ERROR"}
```

### Test Admin Role Access
```bash
# Admin accessing admin route (should succeed)
curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected response
# {"data":[...]}
```

## Session Testing

### Test Session Refresh
```typescript
// Test that session is properly refreshed
describe('Session Management', () => {
  it('refreshes expired session', async () => {
    // Sign in
    const { data } = await supabase.auth.signInWithPassword({
      email: 'test@test.com',
      password: 'password',
    });

    // Wait for token to be near expiry
    // (In practice, use a short-lived test token)

    // Make authenticated request
    const response = await fetch('/api/protected', {
      headers: { Authorization: `Bearer ${data.session?.access_token}` },
    });

    expect(response.ok).toBe(true);
  });
});
```

## Middleware Testing

### Test Middleware Execution
```typescript
// __tests__/middleware.test.ts
import { middleware } from '@/middleware';
import { NextRequest } from 'next/server';

describe('Auth Middleware', () => {
  it('allows public routes', async () => {
    const request = new NextRequest('http://localhost:3000/api/public');
    const response = await middleware(request);

    expect(response.status).not.toBe(401);
  });

  it('blocks protected routes without auth', async () => {
    const request = new NextRequest('http://localhost:3000/api/protected');
    const response = await middleware(request);

    expect(response.status).toBe(401);
  });

  it('allows protected routes with valid auth', async () => {
    const request = new NextRequest('http://localhost:3000/api/protected', {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    const response = await middleware(request);

    expect(response.status).not.toBe(401);
  });
});
```

## Auth Test Checklist

### Public Routes
- [ ] Accessible without authentication
- [ ] Returns expected data

### Protected Routes
- [ ] Returns 401 without token
- [ ] Returns 401 with invalid token
- [ ] Returns 401 with expired token
- [ ] Returns 200 with valid token
- [ ] User context available in handler

### Role-Based Routes
- [ ] Returns 403 for insufficient role
- [ ] Returns 200 for correct role
- [ ] Role correctly identified from token

### Edge Cases
- [ ] Malformed Authorization header
- [ ] Empty token
- [ ] Token with invalid signature
- [ ] Revoked token (if applicable)
