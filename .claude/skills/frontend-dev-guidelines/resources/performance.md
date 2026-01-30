# Performance Optimization

## React Optimization

### Memoization
```tsx
import { memo, useMemo, useCallback } from 'react';

// Memoize component
const ExpensiveList = memo(function ExpensiveList({ items }: { items: Item[] }) {
  return (
    <ul>
      {items.map(item => <li key={item.id}>{item.name}</li>)}
    </ul>
  );
});

// Memoize expensive calculation
function Component({ data }) {
  const processed = useMemo(() => {
    return expensiveProcessing(data);
  }, [data]);

  return <div>{processed}</div>;
}

// Memoize callback
function Parent() {
  const handleClick = useCallback((id: string) => {
    // handle click
  }, []);

  return <Child onClick={handleClick} />;
}
```

### Lazy Loading
```tsx
import { lazy, Suspense } from 'react';

// Lazy load component
const HeavyChart = lazy(() => import('@/components/HeavyChart'));

function Dashboard() {
  return (
    <Suspense fallback={<Skeleton height={400} />}>
      <HeavyChart data={data} />
    </Suspense>
  );
}
```

### Virtual Lists
```tsx
import { FixedSizeList } from 'react-window';

function VirtualList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>{items[index].name}</div>
  );

  return (
    <FixedSizeList
      height={400}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

## Next.js Optimization

### Image Optimization
```tsx
import Image from 'next/image';

// Automatic optimization
<Image
  src="/hero.jpg"
  alt="Hero"
  width={800}
  height={400}
  priority  // Load immediately for above-fold images
/>

// Responsive image
<Image
  src="/photo.jpg"
  alt="Photo"
  fill
  sizes="(max-width: 768px) 100vw, 50vw"
  style={{ objectFit: 'cover' }}
/>
```

### Dynamic Imports
```tsx
import dynamic from 'next/dynamic';

// Skip SSR for client-only components
const ClientOnlyChart = dynamic(
  () => import('@/components/Chart'),
  { ssr: false, loading: () => <Skeleton /> }
);
```

### Route Prefetching
```tsx
import Link from 'next/link';

// Prefetch disabled for rarely visited pages
<Link href="/terms" prefetch={false}>Terms</Link>

// Manual prefetch
import { useRouter } from 'next/navigation';

function Component() {
  const router = useRouter();

  const handleMouseEnter = () => {
    router.prefetch('/dashboard');
  };
}
```

## Data Fetching

### Parallel Requests
```tsx
// Parallel data fetching
export default async function Page() {
  // Start both requests simultaneously
  const [users, posts] = await Promise.all([
    getUsers(),
    getPosts(),
  ]);

  return <Dashboard users={users} posts={posts} />;
}
```

### Caching
```tsx
// Static data (default)
const data = await fetch(url);

// Revalidate every hour
const data = await fetch(url, { next: { revalidate: 3600 } });

// No cache
const data = await fetch(url, { cache: 'no-store' });
```

### SWR Options
```tsx
const { data } = useSWR('/api/user', fetcher, {
  revalidateOnFocus: false,    // Don't refetch on window focus
  revalidateOnReconnect: true, // Refetch on reconnect
  dedupingInterval: 2000,      // Dedupe requests within 2s
  refreshInterval: 0,          // Disable polling
});
```

## Bundle Optimization

### Analyze Bundle
```bash
# Install analyzer
npm install -D @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);

# Run
ANALYZE=true npm run build
```

### Tree Shaking
```tsx
// Good - Named import (tree-shakeable)
import { Button } from '@mui/material';

// Bad - Namespace import
import * as MUI from '@mui/material';
```

## Core Web Vitals

### LCP (Largest Contentful Paint)
- Preload critical resources
- Use `priority` on above-fold images
- Minimize render-blocking resources

### FID (First Input Delay)
- Minimize JavaScript execution
- Break up long tasks
- Use web workers for heavy computation

### CLS (Cumulative Layout Shift)
- Set explicit dimensions on images
- Reserve space for dynamic content
- Avoid inserting content above existing content

```tsx
// Prevent CLS with placeholder
<div style={{ minHeight: 200 }}>
  {isLoading ? <Skeleton height={200} /> : <Content />}
</div>
```
