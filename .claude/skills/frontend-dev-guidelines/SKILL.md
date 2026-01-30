# Frontend Development Guidelines

Client-side patterns for React, Next.js App Router, MUI components, and TypeScript best practices.

## Stack

- **Framework:** React 18+ with Next.js (App Router)
- **UI Library:** MUI (Material UI) v5/v6
- **Language:** TypeScript
- **State:** React Context, Server Components, TanStack Query
- **Styling:** MUI Theme, Emotion

## Activation

This skill activates when you:
- Work with `app/**/*.tsx`, `components/**/*`
- Mention: component, react, ui, frontend, mui, theme, style
- Work with hooks, contexts, form handling

## Quick Reference

### Component Template
```tsx
'use client'; // Only if needed

import { Box, Typography } from '@mui/material';

interface MyComponentProps {
  title: string;
  children?: React.ReactNode;
}

export function MyComponent({ title, children }: MyComponentProps) {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6">{title}</Typography>
      {children}
    </Box>
  );
}
```

### Server vs Client Components

| Use Server Component | Use Client Component |
|---------------------|---------------------|
| Data fetching | Event handlers (onClick, onChange) |
| Access backend | Browser APIs |
| Sensitive data | State (useState, useReducer) |
| Large dependencies | Effects (useEffect) |

### MUI Theme Usage
```tsx
import { useTheme } from '@mui/material/styles';

function Component() {
  const theme = useTheme();
  return (
    <Box sx={{
      color: theme.palette.primary.main,
      p: theme.spacing(2),
      [theme.breakpoints.down('sm')]: { p: 1 },
    }}>
      Content
    </Box>
  );
}
```

### Form Pattern
```tsx
'use client';
import { useState } from 'react';
import { TextField, Button, Stack } from '@mui/material';

export function ContactForm() {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={2}>
      <TextField
        label="Name"
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
      />
      <TextField
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
      />
      <Button type="submit" variant="contained" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Send'}
      </Button>
    </Stack>
  );
}
```

## Core Patterns

### Data Fetching (Server Component)
```tsx
// app/users/page.tsx
import { createClient } from '@/lib/supabase/server';

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: users } = await supabase.from('users').select('*');

  return <UserList users={users || []} />;
}
```

### Client-Side Data Fetching
```tsx
'use client';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function UserProfile({ userId }: { userId: string }) {
  const { data, error, isLoading } = useSWR(`/api/users/${userId}`, fetcher);

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">Failed to load</Alert>;
  return <Typography>{data.name}</Typography>;
}
```

## Commands

- `/frontend-dev-guidelines` - Activate this skill
- `/frontend-dev-guidelines:mui` - MUI component patterns
- `/frontend-dev-guidelines:forms` - Form handling patterns

## Resources

Detailed documentation in `resources/`:
- `components.md` - Component architecture patterns
- `mui-patterns.md` - MUI styling and theming
- `state-management.md` - State handling approaches
- `forms.md` - Form patterns with validation
- `data-fetching.md` - Data fetching strategies
- `routing.md` - Next.js App Router patterns
- `testing.md` - React Testing Library patterns
- `accessibility.md` - a11y guidelines
- `performance.md` - Performance optimization

## Related Skills

- [Backend Guidelines](../backend-dev-guidelines/SKILL.md) - API integration
- [Error Tracking](../error-tracking/SKILL.md) - Error boundaries
