'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from 'flowbite-react';
import { ConfirmProvider } from './ui/ConfirmDialog';
import { askPrismTheme } from '@/lib/flowbite-theme';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider theme={askPrismTheme}>
      <ConfirmProvider>
        {children}
      </ConfirmProvider>
    </ThemeProvider>
  );
}
