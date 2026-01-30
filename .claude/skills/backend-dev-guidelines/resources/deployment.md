# Deployment

## Vercel Configuration

### vercel.json
```json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store" }
      ]
    }
  ]
}
```

### Environment Variables

```bash
# Production (set in Vercel dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Server-only

# Preview deployments (optional overrides)
NEXT_PUBLIC_SUPABASE_URL=https://preview-xxx.supabase.co
```

## Build Configuration

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },

  // Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

## Deployment Checklist

### Before Deploy
- [ ] All tests pass (`npm test`)
- [ ] Type check passes (`npx tsc --noEmit`)
- [ ] Lint passes (`npm run lint`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] Environment variables set in Vercel

### Security Checks
- [ ] No secrets in code
- [ ] `.env.local` in `.gitignore`
- [ ] Service role key only on server
- [ ] RLS policies configured in Supabase

### Performance Checks
- [ ] Images optimized
- [ ] API routes have appropriate caching
- [ ] Database queries are efficient

## Preview Deployments

Vercel creates preview deployments for each PR:

```bash
# Preview URL format
https://[project]-[hash]-[team].vercel.app
```

### Preview Environment
- Use separate Supabase project for previews
- Set preview-specific env vars in Vercel

## Production Deploy

### Via Git
```bash
# Merge to main triggers production deploy
git checkout main
git merge feature-branch
git push origin main
```

### Via CLI
```bash
# Deploy preview
vercel

# Deploy production
vercel --prod
```

## Monitoring

### Vercel Analytics
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Error Tracking
```typescript
// For production error tracking, integrate Sentry or similar
// See error-tracking skill for details
```

## Rollback

```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback [deployment-url]
```
