# Curl Examples

## Basic Requests

### GET
```bash
# Simple GET
curl http://localhost:3000/api/users

# GET with headers
curl http://localhost:3000/api/users \
  -H "Accept: application/json"

# GET with query parameters
curl "http://localhost:3000/api/users?page=1&limit=10&sort=desc"

# Verbose output (see headers)
curl -v http://localhost:3000/api/users
```

### POST
```bash
# POST with JSON body
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'

# POST with data from file
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d @data.json

# POST form data
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/path/to/file.pdf" \
  -F "name=Document"
```

### PUT/PATCH
```bash
# PUT (full update)
curl -X PUT http://localhost:3000/api/users/123 \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","name":"New Name"}'

# PATCH (partial update)
curl -X PATCH http://localhost:3000/api/users/123 \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name"}'
```

### DELETE
```bash
curl -X DELETE http://localhost:3000/api/users/123
```

## Authentication

### Bearer Token
```bash
# Set token
TOKEN="your-jwt-token"

# Use in request
curl http://localhost:3000/api/protected \
  -H "Authorization: Bearer $TOKEN"
```

### Cookie-Based
```bash
# Save cookies
curl -c cookies.txt http://localhost:3000/api/auth/login \
  -d '{"email":"test@test.com","password":"pass"}'

# Use cookies
curl -b cookies.txt http://localhost:3000/api/protected
```

## Response Handling

### Pretty Print JSON
```bash
# Using jq
curl http://localhost:3000/api/users | jq

# Specific field
curl http://localhost:3000/api/users | jq '.data[0].name'

# Filter array
curl http://localhost:3000/api/users | jq '.data[] | select(.role == "admin")'
```

### Response Headers
```bash
# Show only headers
curl -I http://localhost:3000/api/users

# Show headers and body
curl -i http://localhost:3000/api/users
```

### HTTP Status Only
```bash
curl -o /dev/null -s -w "%{http_code}\n" http://localhost:3000/api/users
```

## Testing Patterns

### Test CRUD Operations
```bash
# Create
ID=$(curl -s -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","name":"Test"}' | jq -r '.data.id')

# Read
curl http://localhost:3000/api/users/$ID | jq

# Update
curl -X PATCH http://localhost:3000/api/users/$ID \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated"}'

# Delete
curl -X DELETE http://localhost:3000/api/users/$ID
```

### Test Error Cases
```bash
# Test 400 (Bad Request)
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid"}'

# Test 401 (Unauthorized)
curl http://localhost:3000/api/protected

# Test 404 (Not Found)
curl http://localhost:3000/api/users/nonexistent-id

# Test 409 (Conflict)
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"existing@example.com"}'
```

### Timing
```bash
# Show timing info
curl -w "\nTime: %{time_total}s\n" http://localhost:3000/api/users

# Detailed timing
curl -w "DNS: %{time_namelookup}s\nConnect: %{time_connect}s\nTotal: %{time_total}s\n" \
  http://localhost:3000/api/users
```

## Environment Variables

```bash
# .env.test
API_URL=http://localhost:3000
TOKEN=your-test-token

# Use in scripts
source .env.test
curl $API_URL/api/users -H "Authorization: Bearer $TOKEN"
```

## Useful Aliases

```bash
# Add to .bashrc or .zshrc
alias api='curl -s -H "Content-Type: application/json"'
alias apip='curl -s -X POST -H "Content-Type: application/json"'
alias jc='jq -C | less -R'

# Usage
api http://localhost:3000/api/users | jc
apip http://localhost:3000/api/users -d '{"name":"Test"}'
```
