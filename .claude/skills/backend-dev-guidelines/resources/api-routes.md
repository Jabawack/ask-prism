# API Routes Guide

## App Router (Recommended)

### File Structure
```
app/
└── api/
    ├── users/
    │   ├── route.ts          # GET /api/users, POST /api/users
    │   └── [id]/
    │       └── route.ts      # GET/PUT/DELETE /api/users/[id]
    ├── auth/
    │   ├── login/route.ts
    │   └── logout/route.ts
    └── health/route.ts
```

### Route Handler Template
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});

// GET /api/users
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return NextResponse.json({
      data,
      pagination: { page, limit, total: count }
    });
  } catch (error) {
    console.error('GET /api/users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateUserSchema.parse(body);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('users')
      .insert(validated)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
```

### Dynamic Route Parameters
```typescript
// app/api/users/[id]/route.ts
type RouteParams = { params: Promise<{ id: string }> };

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id } = await params;
  // ... fetch user by id
}
```

## Response Patterns

### Success Responses
```typescript
// Single resource
return NextResponse.json({ data: user });

// Collection
return NextResponse.json({
  data: users,
  pagination: { page, limit, total }
});

// Created
return NextResponse.json({ data: newUser }, { status: 201 });

// No content
return new NextResponse(null, { status: 204 });
```

### Error Responses
```typescript
// Client error
return NextResponse.json(
  { error: 'Invalid request', details: [...] },
  { status: 400 }
);

// Not found
return NextResponse.json(
  { error: 'User not found' },
  { status: 404 }
);

// Server error
return NextResponse.json(
  { error: 'Internal server error' },
  { status: 500 }
);
```

## Headers and CORS

```typescript
export async function GET(request: NextRequest) {
  const data = { /* ... */ };

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, max-age=60',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
```

## Streaming Responses

```typescript
export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (const item of items) {
        controller.enqueue(encoder.encode(JSON.stringify(item) + '\n'));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson' },
  });
}
```
