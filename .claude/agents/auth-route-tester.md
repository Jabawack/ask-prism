---
name: auth-route-tester
description: >
  Tests authentication and authorization for API routes.
  Trigger phrases: test auth, auth-route-tester, test authentication, test protected route
---

# Auth Route Tester

Tests authentication and authorization for API routes.

## Activation

Use when:
- Testing protected endpoints
- Verifying auth middleware
- Checking role-based access
- Validating token handling

## Test Scenarios

### 1. No Authentication
```bash
# Should return 401
curl -X GET http://localhost:3000/api/protected/resource
```

### 2. Invalid Token
```bash
# Should return 401
curl -X GET http://localhost:3000/api/protected/resource \
  -H "Authorization: Bearer invalid-token"
```

### 3. Expired Token
```bash
# Should return 401 with specific message
curl -X GET http://localhost:3000/api/protected/resource \
  -H "Authorization: Bearer <expired-token>"
```

### 4. Valid Authentication
```bash
# Should return 200 with data
curl -X GET http://localhost:3000/api/protected/resource \
  -H "Authorization: Bearer <valid-token>"
```

### 5. Insufficient Permissions
```bash
# User accessing admin route - should return 403
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer <user-token>"
```

## Getting Test Tokens

### From Supabase Dashboard
1. Go to Authentication > Users
2. Click user > Get access token

### Programmatically
```typescript
const { data } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'testpassword',
});
console.log(data.session?.access_token);
```

## Test Checklist

### Public Routes
- [ ] Accessible without auth
- [ ] Rate limiting works

### Protected Routes
- [ ] Returns 401 without token
- [ ] Returns 401 with invalid token
- [ ] Returns 200 with valid token
- [ ] User data correctly extracted

### Admin Routes
- [ ] Regular user gets 403
- [ ] Admin user gets 200
- [ ] Role check works correctly

## Output Format

```markdown
## Auth Test Results: [Endpoint]

### Endpoint: [Method] [Path]
- **Expected Auth**: [Required/Optional/None]
- **Expected Role**: [Admin/User/Any]

### Test Results

| Scenario | Expected | Actual | Status |
|----------|----------|--------|--------|
| No auth | 401 | [result] | ✅/❌ |
| Invalid token | 401 | [result] | ✅/❌ |
| Valid user | 200 | [result] | ✅/❌ |
| Wrong role | 403 | [result] | ✅/❌ |

### Issues Found
- [Issue description]

### Commands Used
```bash
[Actual curl commands used]
```
```

## Invocation

```
@agent auth-route-tester

Test authentication for POST /api/posts
```
