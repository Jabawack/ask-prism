# Next.js App Router Patterns

## File-Based Routing

```
app/
├── page.tsx              # / (home)
├── about/
│   └── page.tsx          # /about
├── blog/
│   ├── page.tsx          # /blog
│   └── [slug]/
│       └── page.tsx      # /blog/[slug]
├── dashboard/
│   ├── layout.tsx        # Shared layout
│   ├── page.tsx          # /dashboard
│   └── settings/
│       └── page.tsx      # /dashboard/settings
└── api/
    └── users/
        └── route.ts      # /api/users
```

## Page Component

```tsx
// app/blog/[slug]/page.tsx
interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BlogPost({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { sort } = await searchParams;

  const post = await getPost(slug);

  return <article>{post.content}</article>;
}
```

## Layouts

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}
```

## Loading States

```tsx
// app/dashboard/loading.tsx
import { Skeleton } from '@mui/material';

export default function Loading() {
  return (
    <div>
      <Skeleton variant="rectangular" height={200} />
      <Skeleton variant="text" />
    </div>
  );
}
```

## Error Handling

```tsx
// app/dashboard/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## Not Found

```tsx
// app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div>
      <h2>Page Not Found</h2>
      <Link href="/">Return Home</Link>
    </div>
  );
}
```

## Navigation

### Link Component
```tsx
import Link from 'next/link';

<Link href="/about">About</Link>
<Link href={`/blog/${post.slug}`}>Read More</Link>
<Link href="/dashboard" prefetch={false}>Dashboard</Link>
```

### Programmatic Navigation
```tsx
'use client';
import { useRouter } from 'next/navigation';

function Component() {
  const router = useRouter();

  const handleClick = () => {
    router.push('/dashboard');
    // or
    router.replace('/login'); // No history entry
    router.back();
    router.forward();
    router.refresh(); // Refresh current route
  };
}
```

## Route Groups

```
app/
├── (marketing)/          # Group without URL segment
│   ├── about/
│   └── contact/
├── (shop)/
│   ├── products/
│   └── cart/
└── (auth)/
    ├── login/
    └── signup/
```

## Parallel Routes

```
app/
├── @modal/               # Parallel route slot
│   └── login/
│       └── page.tsx
├── layout.tsx            # Receives modal as prop
└── page.tsx
```

```tsx
// app/layout.tsx
export default function Layout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
```

## Intercepting Routes

```
app/
├── feed/
│   └── page.tsx
├── photo/
│   └── [id]/
│       └── page.tsx      # Full page view
└── @modal/
    └── (.)photo/         # Intercept /photo/[id]
        └── [id]/
            └── page.tsx  # Modal view
```

## Metadata

```tsx
// Static metadata
export const metadata = {
  title: 'My Page',
  description: 'Page description',
};

// Dynamic metadata
export async function generateMetadata({ params }: PageProps) {
  const post = await getPost(params.slug);
  return {
    title: post.title,
    description: post.excerpt,
  };
}
```
