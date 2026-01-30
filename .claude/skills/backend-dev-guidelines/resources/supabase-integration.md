# Supabase Integration

## Setup

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Server-only
```

### Server Client (App Router)
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
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in Server Components
          }
        },
      },
    }
  );
}
```

### Admin Client (Service Role)
```typescript
// lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

## Query Patterns

### Basic CRUD
```typescript
// Select
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('published', true)
  .order('created_at', { ascending: false });

// Insert
const { data, error } = await supabase
  .from('posts')
  .insert({ title: 'Hello', content: '...' })
  .select()
  .single();

// Update
const { data, error } = await supabase
  .from('posts')
  .update({ title: 'Updated' })
  .eq('id', postId)
  .select()
  .single();

// Delete
const { error } = await supabase
  .from('posts')
  .delete()
  .eq('id', postId);
```

### Relations
```typescript
// Join tables
const { data } = await supabase
  .from('posts')
  .select(`
    id,
    title,
    author:users(id, name, email),
    comments(id, content, created_at)
  `)
  .eq('id', postId)
  .single();
```

### Pagination
```typescript
const { data, count } = await supabase
  .from('posts')
  .select('*', { count: 'exact' })
  .range(from, to)
  .order('created_at', { ascending: false });
```

### Filters
```typescript
// Multiple conditions
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('status', 'published')
  .gte('created_at', startDate)
  .lt('created_at', endDate)
  .in('category', ['tech', 'design']);

// Text search
const { data } = await supabase
  .from('posts')
  .select('*')
  .textSearch('title', query);
```

## Type Safety

### Generate Types
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts
```

### Use Generated Types
```typescript
import { Database } from '@/lib/supabase/types';

type Post = Database['public']['Tables']['posts']['Row'];
type InsertPost = Database['public']['Tables']['posts']['Insert'];

const supabase = createClient<Database>();
```

## RPC Functions

```typescript
// Call stored procedure
const { data, error } = await supabase
  .rpc('get_user_stats', { user_id: userId });
```

## Storage

```typescript
// Upload file
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.png`, file);

// Get public URL
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.png`);
```
