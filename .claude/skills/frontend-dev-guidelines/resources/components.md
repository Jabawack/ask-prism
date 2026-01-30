# Component Architecture

## File Organization

```
components/
├── ui/                    # Generic UI components
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── index.ts
│   └── Card/
├── features/              # Feature-specific components
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── SignupForm.tsx
│   └── dashboard/
├── layouts/               # Layout components
│   ├── MainLayout.tsx
│   └── DashboardLayout.tsx
└── index.ts               # Barrel exports
```

## Component Template

### Basic Component
```tsx
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  disabled?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  onClick,
  disabled = false,
}: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  );
}
```

### Component with Ref
```tsx
import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, ...props }, ref) => (
    <div>
      <label>{label}</label>
      <input ref={ref} {...props} />
      {error && <span className="error">{error}</span>}
    </div>
  )
);

Input.displayName = 'Input';
```

## Server vs Client Components

### Server Component (Default)
```tsx
// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server';
import { DashboardStats } from '@/components/DashboardStats';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: stats } = await supabase.rpc('get_dashboard_stats');

  return <DashboardStats stats={stats} />;
}
```

### Client Component
```tsx
'use client';

import { useState, useEffect } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}
```

### Composition Pattern
```tsx
// Server component with client children
import { ClientInteractiveSection } from './ClientInteractiveSection';

export default async function Page() {
  const data = await fetchData(); // Server-side

  return (
    <main>
      <h1>Server-rendered title</h1>
      <ClientInteractiveSection initialData={data} />
    </main>
  );
}
```

## Props Patterns

### Discriminated Unions
```tsx
type ButtonProps =
  | { variant: 'link'; href: string }
  | { variant: 'button'; onClick: () => void };

function ActionButton(props: ButtonProps) {
  if (props.variant === 'link') {
    return <a href={props.href}>Link</a>;
  }
  return <button onClick={props.onClick}>Button</button>;
}
```

### Children Patterns
```tsx
interface CardProps {
  children: React.ReactNode;
}

interface CardWithSlots {
  header: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function Card({ header, children, footer }: CardWithSlots) {
  return (
    <div className="card">
      <div className="card-header">{header}</div>
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}
```

## Export Patterns

```tsx
// components/Button/index.ts
export { Button } from './Button';
export type { ButtonProps } from './Button';

// components/index.ts
export * from './Button';
export * from './Card';
export * from './Input';
```
