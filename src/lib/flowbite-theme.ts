import { createTheme } from 'flowbite-react';

/**
 * Custom Flowbite theme that integrates with Ask Prism design system.
 * Uses CSS custom properties for consistent theming across all components.
 */
export const askPrismTheme = createTheme({
  // Button - map to our design system colors
  button: {
    color: {
      primary: 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white focus:ring-[var(--color-primary)]/50',
      secondary: 'bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border)] text-[var(--color-text-primary)] border border-[var(--color-border)]',
      success: 'bg-[var(--color-success)] hover:bg-[var(--color-success)]/90 text-white',
      failure: 'bg-[var(--color-error)] hover:bg-[var(--color-error)]/90 text-white',
      warning: 'bg-[var(--color-warning)] hover:bg-[var(--color-warning)]/90 text-white',
      light: 'bg-white hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)]',
      dark: 'bg-[var(--color-text-primary)] hover:bg-[var(--color-text-secondary)] text-white',
    },
    size: {
      xs: 'text-xs px-2 py-1',
      sm: 'text-sm px-3 py-1.5',
      md: 'text-sm px-4 py-2',
      lg: 'text-base px-5 py-2.5',
      xl: 'text-base px-6 py-3',
    },
    base: 'font-medium rounded-[var(--radius-md)] transition-colors focus:outline-none focus:ring-2',
  },

  // Badge - map to design system
  badge: {
    root: {
      base: 'flex items-center gap-1 font-medium rounded-[var(--radius-sm)]',
      color: {
        primary: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
        success: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
        failure: 'bg-[var(--color-error)]/10 text-[var(--color-error)]',
        warning: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
        info: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
        gray: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]',
        dark: 'bg-[var(--color-text-primary)] text-white',
        light: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]',
      },
      size: {
        xs: 'text-xs px-2 py-0.5',
        sm: 'text-sm px-2.5 py-0.5',
      },
    },
  },

  // Progress bar
  progress: {
    base: 'w-full overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-bg-tertiary)]',
    bar: 'rounded-[var(--radius-full)] transition-all duration-300',
    color: {
      primary: 'bg-[var(--color-primary)]',
      success: 'bg-[var(--color-success)]',
      failure: 'bg-[var(--color-error)]',
      warning: 'bg-[var(--color-warning)]',
      dark: 'bg-[var(--color-text-primary)]',
    },
    size: {
      sm: 'h-1.5',
      md: 'h-2',
      lg: 'h-4',
      xl: 'h-6',
    },
  },

  // Text input
  textInput: {
    field: {
      input: {
        base: 'block w-full rounded-[var(--radius-md)] border bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-placeholder)] focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)] transition-colors',
        colors: {
          gray: 'border-[var(--color-border)] focus:border-[var(--color-primary)]',
          failure: 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/50',
          success: 'border-[var(--color-success)] focus:border-[var(--color-success)] focus:ring-[var(--color-success)]/50',
        },
        sizes: {
          sm: 'text-sm p-2',
          md: 'text-sm p-2.5',
          lg: 'text-base p-3',
        },
      },
    },
  },

  // Textarea
  textarea: {
    base: 'block w-full rounded-[var(--radius-md)] border bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-placeholder)] focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)] transition-colors',
    colors: {
      gray: 'border-[var(--color-border)]',
      failure: 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/50',
      success: 'border-[var(--color-success)] focus:border-[var(--color-success)] focus:ring-[var(--color-success)]/50',
    },
  },

  // Alert
  alert: {
    base: 'flex flex-col gap-2 p-4 rounded-[var(--radius-lg)] text-sm',
    color: {
      info: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20',
      success: 'bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/20',
      failure: 'bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/20',
      warning: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)] border border-[var(--color-warning)]/20',
      dark: 'bg-[var(--color-text-primary)] text-white',
      light: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)]',
    },
  },

  // Card
  card: {
    root: {
      base: 'flex flex-col rounded-[var(--radius-lg)] border bg-[var(--color-bg-primary)] shadow-sm',
      children: 'flex flex-col gap-4 p-6',
    },
  },

  // Modal / Dialog
  modal: {
    root: {
      base: 'fixed inset-0 z-50 overflow-y-auto overflow-x-hidden',
    },
    content: {
      base: 'relative h-full w-full p-4 md:h-auto',
      inner: 'relative flex max-h-[90dvh] flex-col rounded-[var(--radius-lg)] bg-[var(--color-bg-primary)] shadow-lg',
    },
    header: {
      base: 'flex items-start justify-between rounded-t border-b border-[var(--color-border)] p-5',
      title: 'text-xl font-semibold text-[var(--color-text-primary)]',
      close: {
        base: 'ml-auto inline-flex items-center rounded-[var(--radius-md)] p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]',
      },
    },
    body: {
      base: 'flex-1 overflow-auto p-6',
    },
    footer: {
      base: 'flex items-center justify-end gap-2 rounded-b border-t border-[var(--color-border)] p-6',
    },
  },

  // Tabs
  tabs: {
    tablist: {
      base: 'flex border-b border-[var(--color-border)]',
      tabitem: {
        base: 'flex items-center justify-center rounded-t-[var(--radius-md)] p-4 text-sm font-medium transition-colors',
        styles: {
          default: {
            base: 'rounded-t-[var(--radius-md)]',
            active: {
              on: 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]',
              off: 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]',
            },
          },
        },
      },
    },
    tabpanel: 'py-4',
  },

  // Tooltip
  tooltip: {
    target: 'w-fit',
    animation: 'transition-opacity',
    arrow: {
      base: 'absolute z-10 h-2 w-2 rotate-45',
      style: {
        dark: 'bg-[var(--color-text-primary)]',
        light: 'bg-[var(--color-bg-primary)] border border-[var(--color-border)]',
        auto: 'bg-[var(--color-bg-primary)] border border-[var(--color-border)]',
      },
    },
    content: 'relative z-20 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium shadow-lg',
    style: {
      dark: 'bg-[var(--color-text-primary)] text-white',
      light: 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border)]',
      auto: 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border)]',
    },
  },

  // Avatar
  avatar: {
    root: {
      base: 'flex items-center justify-center overflow-hidden rounded-full',
      size: {
        xs: 'h-6 w-6',
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-20 w-20',
        xl: 'h-36 w-36',
      },
      color: {
        primary: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
        success: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
        failure: 'bg-[var(--color-error)]/10 text-[var(--color-error)]',
        warning: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
        gray: 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]',
      },
    },
    initials: {
      base: 'font-medium',
    },
  },

  // Dropdown
  dropdown: {
    floating: {
      base: 'z-10 w-fit rounded-[var(--radius-md)] bg-[var(--color-bg-primary)] divide-y divide-[var(--color-border)] shadow-lg border border-[var(--color-border)]',
      item: {
        base: 'flex w-full cursor-pointer items-center justify-start px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]',
      },
    },
  },

  // Toggle / Switch
  toggleSwitch: {
    root: {
      base: 'group flex items-center',
      active: {
        on: 'cursor-pointer',
        off: 'cursor-not-allowed opacity-50',
      },
    },
    toggle: {
      base: 'relative rounded-full border after:absolute after:rounded-full after:bg-white after:transition-all group-focus:ring-2 group-focus:ring-[var(--color-primary)]/50',
      checked: {
        on: 'bg-[var(--color-primary)] border-[var(--color-primary)] after:translate-x-full',
        off: 'bg-[var(--color-bg-tertiary)] border-[var(--color-border)]',
      },
      sizes: {
        sm: 'h-5 w-9 after:h-4 after:w-4 after:left-[2px] after:top-[2px]',
        md: 'h-6 w-11 after:h-5 after:w-5 after:left-[2px] after:top-[2px]',
        lg: 'h-7 w-14 after:h-6 after:w-6 after:left-[4px] after:top-[2px]',
      },
    },
  },

  // Accordion
  accordion: {
    root: {
      base: 'divide-y divide-[var(--color-border)] border-[var(--color-border)]',
      flush: {
        off: 'rounded-[var(--radius-lg)] border',
        on: 'border-b',
      },
    },
    title: {
      base: 'flex w-full items-center justify-between p-5 text-left font-medium text-[var(--color-text-primary)]',
      open: {
        on: 'bg-[var(--color-bg-secondary)]',
        off: 'bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-secondary)]',
      },
    },
    content: {
      base: 'p-5 bg-[var(--color-bg-primary)]',
    },
  },

  // Spinner
  spinner: {
    base: 'animate-spin',
    color: {
      primary: 'fill-[var(--color-primary)]',
      success: 'fill-[var(--color-success)]',
      failure: 'fill-[var(--color-error)]',
      warning: 'fill-[var(--color-warning)]',
      info: 'fill-[var(--color-primary)]',
      gray: 'fill-[var(--color-text-muted)]',
    },
    size: {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
      xl: 'h-10 w-10',
    },
  },

  // Table - use CSS variables for dark mode support
  table: {
    root: {
      base: 'w-full text-left text-sm text-[var(--color-text-secondary)]',
      shadow: '',
      wrapper: 'relative',
    },
    head: {
      base: 'text-xs uppercase text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)]',
      cell: {
        base: 'px-6 py-3 bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]',
      },
    },
    row: {
      base: 'border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]',
      hovered: 'hover:bg-[var(--color-bg-secondary)]',
      striped: 'odd:bg-[var(--color-bg-primary)] even:bg-[var(--color-bg-secondary)]',
    },
    body: {
      base: 'divide-y divide-[var(--color-border)]',
      cell: {
        base: 'px-6 py-4 text-[var(--color-text-primary)]',
      },
    },
  },
});
