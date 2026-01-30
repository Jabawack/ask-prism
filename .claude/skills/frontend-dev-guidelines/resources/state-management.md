# State Management

## State Categories

| Type | Solution | Example |
|------|----------|---------|
| Server State | TanStack Query, SWR | API data, DB records |
| Client State | useState, useReducer | Form input, UI state |
| Global State | Context, Zustand | Theme, User session |
| URL State | useSearchParams | Filters, pagination |

## Local State (useState)

```tsx
'use client';
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}
```

## Complex State (useReducer)

```tsx
'use client';
import { useReducer } from 'react';

type State = { count: number; step: number };
type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'setStep'; payload: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + state.step };
    case 'decrement':
      return { ...state, count: state.count - state.step };
    case 'setStep':
      return { ...state, step: action.payload };
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0, step: 1 });

  return (
    <div>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <span>{state.count}</span>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
    </div>
  );
}
```

## Context Pattern

```tsx
// contexts/auth-context.tsx
'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );
    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

## Server State (SWR)

```tsx
'use client';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

function Profile({ userId }: { userId: string }) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/users/${userId}`,
    fetcher
  );

  if (isLoading) return <Loading />;
  if (error) return <Error />;

  const handleUpdate = async (newData: Partial<User>) => {
    // Optimistic update
    mutate({ ...data, ...newData }, false);

    await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(newData),
    });

    // Revalidate
    mutate();
  };

  return <UserProfile user={data} onUpdate={handleUpdate} />;
}
```

## URL State

```tsx
'use client';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

function FilteredList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const category = searchParams.get('category') || 'all';
  const page = parseInt(searchParams.get('page') || '1');

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div>
      <select
        value={category}
        onChange={(e) => updateFilter('category', e.target.value)}
      >
        <option value="all">All</option>
        <option value="tech">Tech</option>
      </select>
    </div>
  );
}
```

## Best Practices

1. **Lift state minimally** - Keep state close to where it's used
2. **Derive when possible** - Calculate values instead of storing
3. **Batch updates** - React 18 batches by default
4. **Memoize expensive operations** - Use useMemo for heavy computations
