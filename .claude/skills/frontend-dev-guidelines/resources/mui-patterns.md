# MUI Patterns

## Theme Setup

```tsx
// theme/index.ts
'use client';
import { createTheme, responsiveFontSizes } from '@mui/material/styles';

const baseTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#9c27b0',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    button: { textTransform: 'none' },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: '1px solid',
          borderColor: 'divider',
        },
      },
    },
  },
});

export const theme = responsiveFontSizes(baseTheme);
```

## Theme Provider

```tsx
// app/providers.tsx
'use client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from '@/theme';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
```

## sx Prop Patterns

```tsx
import { Box, Typography, Button } from '@mui/material';

function StyledComponent() {
  return (
    <Box
      sx={{
        // Spacing (theme.spacing units)
        p: 2,           // padding: 16px
        m: 'auto',      // margin: auto
        gap: 1,         // gap: 8px

        // Colors
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderColor: 'divider',

        // Responsive
        width: { xs: '100%', sm: 400, md: 600 },
        display: { xs: 'block', md: 'flex' },

        // Pseudo-selectors
        '&:hover': {
          bgcolor: 'action.hover',
        },

        // Nested elements
        '& .MuiTypography-root': {
          fontWeight: 500,
        },
      }}
    >
      <Typography>Content</Typography>
    </Box>
  );
}
```

## Common Component Patterns

### Card with Actions
```tsx
import { Card, CardContent, CardActions, Typography, Button } from '@mui/material';

function PostCard({ post }: { post: Post }) {
  return (
    <Card sx={{ maxWidth: 345 }}>
      <CardContent>
        <Typography gutterBottom variant="h5">
          {post.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {post.excerpt}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small">Read More</Button>
        <Button size="small">Share</Button>
      </CardActions>
    </Card>
  );
}
```

### Data Table
```tsx
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper
} from '@mui/material';

function DataTable({ rows }: { rows: User[] }) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell align="right">
                <IconButton size="small"><EditIcon /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
```

### Loading States
```tsx
import { Skeleton, CircularProgress, Box } from '@mui/material';

// Skeleton for content placeholder
function ContentSkeleton() {
  return (
    <Box sx={{ width: '100%' }}>
      <Skeleton variant="text" sx={{ fontSize: '2rem' }} />
      <Skeleton variant="rectangular" height={200} />
      <Skeleton variant="text" />
      <Skeleton variant="text" />
    </Box>
  );
}

// Spinner for actions
function LoadingButton({ loading, children, ...props }: LoadingButtonProps) {
  return (
    <Button disabled={loading} {...props}>
      {loading ? <CircularProgress size={20} /> : children}
    </Button>
  );
}
```

## Dark Mode

```tsx
// hooks/useColorMode.ts
'use client';
import { useState, useMemo, createContext, useContext } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const ColorModeContext = createContext({ toggleColorMode: () => {} });

export function ColorModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => setMode(prev => prev === 'light' ? 'dark' : 'light'),
    }),
    []
  );

  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export const useColorMode = () => useContext(ColorModeContext);
```
