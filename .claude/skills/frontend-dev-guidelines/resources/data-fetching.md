# Data Fetching Strategies

## Server Components (Recommended Default)

```tsx
// app/users/page.tsx
import { createClient } from '@/lib/supabase/server';

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch users');
  }

  return <UserList users={users} />;
}
```

## With Loading State

```tsx
// app/users/loading.tsx
import { Skeleton, Stack } from '@mui/material';

export default function Loading() {
  return (
    <Stack spacing={2}>
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} variant="rectangular" height={80} />
      ))}
    </Stack>
  );
}
```

## With Error Handling

```tsx
// app/users/error.tsx
'use client';
import { Alert, Button } from '@mui/material';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" onClick={reset}>
          Try Again
        </Button>
      }
    >
      {error.message}
    </Alert>
  );
}
```

## Client-Side with SWR

```tsx
'use client';
import useSWR from 'swr';
import { CircularProgress, Alert } from '@mui/material';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export function UserProfile({ userId }: { userId: string }) {
  const { data, error, isLoading } = useSWR(
    `/api/users/${userId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error.message}</Alert>;

  return <div>{data.name}</div>;
}
```

## SWR with Mutation

```tsx
'use client';
import useSWR, { mutate } from 'swr';

export function UserEditor({ userId }: { userId: string }) {
  const { data: user } = useSWR(`/api/users/${userId}`, fetcher);

  const handleSave = async (updates: Partial<User>) => {
    // Optimistic update
    mutate(`/api/users/${userId}`, { ...user, ...updates }, false);

    // API call
    await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    // Revalidate
    mutate(`/api/users/${userId}`);
  };

  return <EditForm user={user} onSave={handleSave} />;
}
```

## Infinite Loading

```tsx
'use client';
import useSWRInfinite from 'swr/infinite';
import { Button } from '@mui/material';

const PAGE_SIZE = 10;

const getKey = (pageIndex: number, previousPageData: any) => {
  if (previousPageData && !previousPageData.length) return null;
  return `/api/posts?page=${pageIndex + 1}&limit=${PAGE_SIZE}`;
};

export function InfinitePostList() {
  const { data, size, setSize, isLoading, isValidating } = useSWRInfinite(
    getKey,
    fetcher
  );

  const posts = data ? data.flatMap(page => page.data) : [];
  const isLoadingMore = isLoading || (size > 0 && !data?.[size - 1]);
  const isReachingEnd = data?.[size - 1]?.data?.length < PAGE_SIZE;

  return (
    <div>
      {posts.map(post => <PostCard key={post.id} post={post} />)}

      <Button
        onClick={() => setSize(size + 1)}
        disabled={isLoadingMore || isReachingEnd}
      >
        {isLoadingMore ? 'Loading...' : isReachingEnd ? 'No more posts' : 'Load more'}
      </Button>
    </div>
  );
}
```

## Parallel Data Fetching

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react';

async function Stats() {
  const stats = await fetchStats();
  return <StatsCard stats={stats} />;
}

async function RecentActivity() {
  const activity = await fetchActivity();
  return <ActivityList activity={activity} />;
}

export default function Dashboard() {
  return (
    <div>
      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>
      <Suspense fallback={<ActivitySkeleton />}>
        <RecentActivity />
      </Suspense>
    </div>
  );
}
```

## Caching Strategies

```tsx
// Static (cache forever)
const data = await fetch(url, { cache: 'force-cache' });

// Revalidate every hour
const data = await fetch(url, { next: { revalidate: 3600 } });

// No cache (always fresh)
const data = await fetch(url, { cache: 'no-store' });

// Revalidate on demand (in Server Action)
import { revalidatePath, revalidateTag } from 'next/cache';
revalidatePath('/posts');
revalidateTag('posts');
```
