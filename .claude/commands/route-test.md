# /route-test

Quick API route testing command.

## Usage

```
/route-test [method] [path] [options]
```

## Examples

```bash
# Simple GET
/route-test GET /api/users

# GET with query params
/route-test GET /api/users?page=1&limit=10

# POST with body
/route-test POST /api/users --body '{"name":"Test","email":"test@test.com"}'

# With authentication
/route-test GET /api/protected/data --auth

# Full example
/route-test POST /api/posts --auth --body '{"title":"Hello"}'
```

## Options

| Option | Description |
|--------|-------------|
| `--auth` | Include authentication token |
| `--body '{...}'` | JSON body for POST/PUT |
| `--headers '{...}'` | Custom headers |
| `--verbose` | Show full request/response |

## Output Format

```
[Method] [Path]
Status: [code]
Time: [ms]

Response:
{
  "data": { ... }
}
```

## Common Patterns

### Test CRUD Operations
```bash
# Create
/route-test POST /api/users --body '{"name":"Test"}'

# Read
/route-test GET /api/users/123

# Update
/route-test PUT /api/users/123 --body '{"name":"Updated"}'

# Delete
/route-test DELETE /api/users/123
```

### Test Auth Scenarios
```bash
# Without auth (expect 401)
/route-test GET /api/protected

# With auth (expect 200)
/route-test GET /api/protected --auth
```

### Test Validation
```bash
# Missing required field (expect 400)
/route-test POST /api/users --body '{}'

# Invalid email (expect 400)
/route-test POST /api/users --body '{"email":"invalid"}'
```

## Error Responses

The command shows:
- Status code
- Error message
- Validation details (if any)

```
Status: 400
{
  "error": "Validation failed",
  "details": [
    { "path": "email", "message": "Invalid email" }
  ]
}
```
