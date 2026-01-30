# Database Patterns

## Supabase Query Patterns

### Basic Queries
```typescript
// Select all
const { data } = await supabase.from('posts').select('*');

// Select specific columns
const { data } = await supabase.from('posts').select('id, title, created_at');

// Select with count
const { data, count } = await supabase
  .from('posts')
  .select('*', { count: 'exact' });
```

### Filtering
```typescript
// Equality
.eq('status', 'published')

// Not equal
.neq('status', 'draft')

// Greater than / Less than
.gt('views', 100)
.gte('views', 100)
.lt('views', 1000)
.lte('views', 1000)

// Range
.range(0, 9) // First 10 items

// In array
.in('category', ['tech', 'design'])

// Like (case sensitive)
.like('title', '%Hello%')

// ILike (case insensitive)
.ilike('title', '%hello%')

// Is null / not null
.is('deleted_at', null)
.not('deleted_at', 'is', null)
```

### Relations
```typescript
// Join related table (foreign key)
const { data } = await supabase
  .from('posts')
  .select(`
    id,
    title,
    author:users(id, name, avatar_url),
    comments(id, content, created_at)
  `);

// Nested relations
const { data } = await supabase
  .from('posts')
  .select(`
    *,
    comments(
      *,
      user:users(name)
    )
  `);
```

### Ordering
```typescript
// Single column
.order('created_at', { ascending: false })

// Multiple columns
.order('category').order('created_at', { ascending: false })

// Order on relation
.select('*, comments(*)').order('created_at', { foreignTable: 'comments' })
```

### Pagination
```typescript
// Offset pagination
const PAGE_SIZE = 10;
const page = 1;

const { data, count } = await supabase
  .from('posts')
  .select('*', { count: 'exact' })
  .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

const totalPages = Math.ceil(count / PAGE_SIZE);
```

### Cursor Pagination
```typescript
// More efficient for large datasets
const { data } = await supabase
  .from('posts')
  .select('*')
  .order('created_at', { ascending: false })
  .lt('created_at', lastCursor)
  .limit(10);

const nextCursor = data[data.length - 1]?.created_at;
```

## Insert Patterns

```typescript
// Single insert
const { data, error } = await supabase
  .from('posts')
  .insert({ title: 'Hello', content: '...' })
  .select()
  .single();

// Bulk insert
const { data, error } = await supabase
  .from('posts')
  .insert([
    { title: 'Post 1' },
    { title: 'Post 2' },
  ])
  .select();

// Upsert (insert or update)
const { data, error } = await supabase
  .from('posts')
  .upsert({ id: existingId, title: 'Updated' })
  .select()
  .single();
```

## Update Patterns

```typescript
// Update by ID
const { data, error } = await supabase
  .from('posts')
  .update({ title: 'New Title' })
  .eq('id', postId)
  .select()
  .single();

// Bulk update
const { data, error } = await supabase
  .from('posts')
  .update({ status: 'archived' })
  .lt('created_at', cutoffDate);
```

## Delete Patterns

```typescript
// Hard delete
const { error } = await supabase
  .from('posts')
  .delete()
  .eq('id', postId);

// Soft delete (recommended)
const { error } = await supabase
  .from('posts')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', postId);
```

## Transaction-like Operations

```typescript
// Use RPC for complex operations
const { data, error } = await supabase.rpc('transfer_funds', {
  sender_id: senderId,
  receiver_id: receiverId,
  amount: 100,
});
```

## Performance Tips

1. **Select only needed columns** - Avoid `select('*')` in production
2. **Use indexes** - Add indexes for frequently filtered columns
3. **Pagination** - Always paginate large result sets
4. **Connection pooling** - Use Supabase's built-in pooling
5. **Batch operations** - Use bulk insert/update when possible
