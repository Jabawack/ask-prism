# Service Layer Architecture

## Purpose

Services encapsulate business logic, keeping route handlers thin and logic reusable.

## Structure

```
services/
├── user.service.ts
├── post.service.ts
├── auth.service.ts
└── index.ts          # Re-exports
```

## Service Pattern

```typescript
// services/user.service.ts
import { createClient } from '@/lib/supabase/server';
import { NotFoundError, ConflictError, DatabaseError } from '@/lib/errors';
import { CreateUserInput, UpdateUserInput } from '@/lib/validations/user';
import type { Database } from '@/lib/supabase/types';

type User = Database['public']['Tables']['users']['Row'];

export class UserService {
  /**
   * Get user by ID
   */
  static async getById(id: string): Promise<User> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('User');
      }
      throw new DatabaseError(error.message);
    }

    return data;
  }

  /**
   * Get user by email
   */
  static async getByEmail(email: string): Promise<User | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error?.code === 'PGRST116') {
      return null;
    }
    if (error) {
      throw new DatabaseError(error.message);
    }

    return data;
  }

  /**
   * List users with pagination
   */
  static async list(page: number = 1, limit: number = 10) {
    const supabase = await createClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError(error.message);
    }

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Create new user
   */
  static async create(input: CreateUserInput): Promise<User> {
    const supabase = await createClient();

    // Check for existing user
    const existing = await this.getByEmail(input.email);
    if (existing) {
      throw new ConflictError('User with this email already exists');
    }

    const { data, error } = await supabase
      .from('users')
      .insert(input)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(error.message);
    }

    return data;
  }

  /**
   * Update user
   */
  static async update(id: string, input: UpdateUserInput): Promise<User> {
    const supabase = await createClient();

    // Ensure user exists
    await this.getById(id);

    const { data, error } = await supabase
      .from('users')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(error.message);
    }

    return data;
  }

  /**
   * Delete user
   */
  static async delete(id: string): Promise<void> {
    const supabase = await createClient();

    // Ensure user exists
    await this.getById(id);

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw new DatabaseError(error.message);
    }
  }
}
```

## Using Services in Routes

```typescript
// app/api/users/route.ts
import { UserService } from '@/services/user.service';
import { handleApiError } from '@/lib/api/error-handler';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const result = await UserService.list(page, limit);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateUserSchema.parse(body);
    const user = await UserService.create(validated);
    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

## Benefits

1. **Reusability** - Same logic used in routes, webhooks, background jobs
2. **Testability** - Easy to mock and test in isolation
3. **Maintainability** - Business logic in one place
4. **Type Safety** - Full TypeScript support
