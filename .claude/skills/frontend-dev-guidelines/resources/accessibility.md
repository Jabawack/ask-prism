# Accessibility (a11y)

## Core Principles

1. **Perceivable** - Content available to all senses
2. **Operable** - Interface usable by all input methods
3. **Understandable** - Content and UI are clear
4. **Robust** - Works across technologies

## Semantic HTML

### Use Proper Elements
```tsx
// Good
<button onClick={handleClick}>Submit</button>
<nav><ul><li><a href="/home">Home</a></li></ul></nav>
<main><article><h1>Title</h1></article></main>

// Bad
<div onClick={handleClick}>Submit</div>
<div class="nav"><div><span onclick="...">Home</span></div></div>
```

### Heading Hierarchy
```tsx
// Good - Logical order
<h1>Page Title</h1>
<h2>Section</h2>
<h3>Subsection</h3>

// Bad - Skipping levels
<h1>Page Title</h1>
<h3>Section</h3>  // Skipped h2
```

## ARIA Attributes

### Labels
```tsx
// Input with visible label
<TextField label="Email" />

// Icon button needs aria-label
<IconButton aria-label="Delete item">
  <DeleteIcon />
</IconButton>

// Link with additional context
<Link href={`/posts/${id}`} aria-label={`Read more about ${title}`}>
  Read more
</Link>
```

### Live Regions
```tsx
// Announce dynamic content
<Alert role="alert" aria-live="polite">
  Form submitted successfully
</Alert>

// For urgent announcements
<div role="status" aria-live="assertive">
  Error: Connection lost
</div>
```

### States
```tsx
<Button aria-disabled={isLoading} disabled={isLoading}>
  {isLoading ? 'Loading...' : 'Submit'}
</Button>

<Accordion>
  <AccordionSummary aria-expanded={expanded}>
    Section Title
  </AccordionSummary>
</Accordion>
```

## Keyboard Navigation

### Focus Management
```tsx
'use client';
import { useRef, useEffect } from 'react';

function Modal({ isOpen, onClose, children }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogContent>
        {children}
        <Button ref={closeButtonRef} onClick={onClose}>
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

### Focus Trap
```tsx
// MUI Dialog handles focus trap automatically
<Dialog open={open} onClose={handleClose}>
  {/* Focus is trapped within */}
</Dialog>
```

### Skip Links
```tsx
// At top of page
<a href="#main-content" className="skip-link">
  Skip to main content
</a>

<main id="main-content">
  {/* Page content */}
</main>

// CSS
.skip-link {
  position: absolute;
  left: -9999px;
}
.skip-link:focus {
  left: 0;
  z-index: 9999;
}
```

## Color and Contrast

### Minimum Contrast
- Normal text: 4.5:1
- Large text (18px+): 3:1
- UI components: 3:1

### Don't Rely on Color Alone
```tsx
// Good - Icon + color
<Alert severity="error">
  <ErrorIcon /> Error message
</Alert>

// Bad - Color only
<span style={{ color: 'red' }}>Error</span>
```

## Forms

### Labels and Instructions
```tsx
<FormControl>
  <InputLabel htmlFor="email">Email</InputLabel>
  <TextField
    id="email"
    aria-describedby="email-helper"
  />
  <FormHelperText id="email-helper">
    We'll never share your email
  </FormHelperText>
</FormControl>
```

### Error Messages
```tsx
<TextField
  error={!!errors.email}
  helperText={errors.email?.message}
  inputProps={{
    'aria-invalid': !!errors.email,
    'aria-describedby': errors.email ? 'email-error' : undefined,
  }}
/>
```

## Images

```tsx
// Informative image
<img src="chart.png" alt="Sales increased 25% in Q4" />

// Decorative image
<img src="decoration.png" alt="" role="presentation" />

// Complex image
<figure>
  <img src="diagram.png" alt="System architecture" />
  <figcaption>
    Detailed description of the system architecture...
  </figcaption>
</figure>
```

## Testing Accessibility

```bash
# Install axe-core
npm install -D @axe-core/react

# In development
import React from 'react';
import ReactDOM from 'react-dom';

if (process.env.NODE_ENV !== 'production') {
  import('@axe-core/react').then(axe => {
    axe.default(React, ReactDOM, 1000);
  });
}
```
