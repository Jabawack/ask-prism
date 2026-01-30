# Backend Development Guidelines

Server-side patterns for Next.js API routes, Supabase integration, and Node.js best practices.

## Stack

- **Runtime:** Node.js
- **Framework:** Next.js (App Router)
- **Database:** Supabase (PostgreSQL)
- **Language:** TypeScript
- **Deployment:** Vercel

## Activation

This skill activates when you:
- Work with `app/api/` or `pages/api/` files
- Mention: api, route, endpoint, backend, server, supabase, database
- Work with `lib/supabase/`, `services/`, `middleware.ts`

## Quick Reference

### API Route Structure (App Router)
```typescript
// app/api/[resource]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  // ... handler logic
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // ... handler logic
}
```

### Supabase Server Client
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}
```

### Error Response Pattern
```typescript
return NextResponse.json(
  { error: 'Resource not found' },
  { status: 404 }
);
```

## Core Patterns

### Authentication Middleware
```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(/*...*/);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith('/api/protected')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return response;
}
```

### Service Layer
```typescript
// services/user.service.ts
import { createClient } from '@/lib/supabase/server';

export class UserService {
  static async getById(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new DatabaseError(error.message);
    return data;
  }
}
```

## Commands

- `/backend-dev-guidelines` - Activate this skill
- `/backend-dev-guidelines:supabase` - Supabase patterns
- `/backend-dev-guidelines:api` - API route patterns

## Resources

Detailed documentation in `resources/`:
- `api-routes.md` - Complete API route patterns
- `supabase-integration.md` - Supabase client setup and queries
- `authentication.md` - Auth patterns with Supabase Auth
- `error-handling.md` - Error handling and responses
- `validation.md` - Input validation with Zod
- `middleware.md` - Middleware patterns
- `services.md` - Service layer architecture
- `database-patterns.md` - Database query patterns
- `testing.md` - API testing strategies
- `deployment.md` - Vercel deployment configuration

## Related Skills

- [Frontend Guidelines](../frontend-dev-guidelines/SKILL.md) - Client-side integration
- [Route Tester](../route-tester/SKILL.md) - API endpoint testing
- [Error Tracking](../error-tracking/SKILL.md) - Error logging and monitoring
