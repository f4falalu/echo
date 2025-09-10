# Cloudflare Workers Redirect Issue - Fix Documentation

## Problem Summary
After deploying to Cloudflare Workers, the application fails to load when accessing redirect URLs (like `/` or `/app/`) during cold starts. However, direct URLs work fine, and once loaded, all redirects work correctly.

## Root Cause
The issue stems from how Cloudflare Workers handles SSR (Server-Side Rendering) during cold starts:
1. JavaScript redirects thrown during SSR (`beforeLoad` hooks) don't execute properly
2. The SSR context on edge workers has limitations with redirect handling
3. Cookie-based authentication checks may not initialize properly during cold starts

## Solutions Applied

### Solution 1: Client-Only Redirects (Currently Implemented)
Modified routes to only perform redirects on the client-side:

**Files Modified:**
- `/src/routes/index.tsx`
- `/src/routes/app/index.tsx`

**Changes:**
```typescript
// Before (problematic)
beforeLoad: async () => {
  throw redirect({ to: '/app/home', replace: true, statusCode: 302 });
}

// After (fixed)
beforeLoad: async () => {
  if (!isServer) {
    throw redirect({ to: '/app/home', replace: true });
  }
},
loader: async () => {
  if (isServer) {
    return { shouldRedirect: true, redirectTo: '/app/home' };
  }
  return {};
},
component: () => {
  const data = Route.useLoaderData();
  React.useEffect(() => {
    if (data?.shouldRedirect) {
      window.location.href = data.redirectTo;
    }
  }, [data]);
  return <div>Redirecting...</div>;
}
```

### Solution 2: Meta Refresh Fallback (Alternative)
If issues persist, use HTML meta refresh as a more reliable fallback:

```typescript
head: () => ({
  meta: [
    { 'http-equiv': 'refresh', content: '0; url=/app/home' },
  ],
})
```

See `/src/routes/index.alternative.tsx` for full implementation.

## Additional Recommendations

### 1. Optimize Cold Starts
Add warming strategy in `wrangler.jsonc`:
```json
{
  "triggers": {
    "crons": ["*/5 * * * *"]
  }
}
```

### 2. Consider Edge-Specific Routing
For production, consider using Cloudflare's native routing features:
```json
// wrangler.jsonc
{
  "routes": [
    { "pattern": "/", "redirect": "/app/home" }
  ]
}
```

### 3. Monitor Performance
Enable Cloudflare Analytics to track cold start frequency:
```json
{
  "observability": {
    "enabled": true,
    "head_sampling_rate": 1
  }
}
```

## Testing the Fix

1. **Local Testing:**
   ```bash
   npm run build
   npx wrangler dev
   ```

2. **Staging Deployment:**
   ```bash
   npx wrangler deploy --env staging
   ```

3. **Test Scenarios:**
   - Cold start: Open incognito window, navigate to `/`
   - Warm start: Navigate to `/` after loading any other page
   - Direct access: Navigate directly to `/app/home`
   - Authentication flow: Test login/logout redirects

## Rollback Plan
If issues persist after deployment:
1. Keep original files as `.backup`
2. Revert changes using git
3. Consider server-side HTTP redirects in Cloudflare configuration

## Related Issues
- TanStack Start SSR limitations: https://tanstack.com/router/latest/docs/framework/react/start/ssr
- Cloudflare Workers SSR: https://developers.cloudflare.com/workers/examples/render-react-app/
- Supabase SSR auth: https://supabase.com/docs/guides/auth/server-side-rendering

## Contact
If problems persist, consider:
1. Opening issue in TanStack Start repository
2. Cloudflare Workers Discord community
3. Implementing pure HTTP redirects at edge level
