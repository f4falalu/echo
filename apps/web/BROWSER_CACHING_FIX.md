# Browser Redirect Caching Issue - Fix Documentation

## ✅ The Real Problem: Browser Caching

Your issue wasn't with Cloudflare Workers or SSR - it was **browser caching of redirects**!

### Evidence:
- ✅ **Incognito mode works perfectly** (no cache)
- ❌ **Regular browser fails** (has cached redirects)
- ❌ **After deployment, old cached redirects persist**

## 🔍 Root Cause

1. **301 (Permanent) redirects are cached aggressively** by browsers
2. Browsers remember these redirects **even after deployments**
3. The cached redirects were causing the loading issues

## ✅ Solutions Applied

### 1. Changed All Status Codes from 301 to 307
**Why 307?**
- **301**: Permanent redirect (heavily cached)
- **302**: Temporary redirect (sometimes cached)
- **307**: Temporary redirect (NEVER cached)

**Files Updated:**
- `/src/routes/app/index.tsx` - Changed 301 → 307
- `/src/routes/app.tsx` - Changed 302 → 307
- `/src/routes/auth.logout.tsx` - Changed 301 → 307
- `/src/routes/app/_settings/settings.index.tsx` - Changed 301 → 307
- `/src/routes/app/_app/datasets.$datasetId.tsx` - Changed 301 → 307
- `/src/routes/app/_app/datasets.$datasetId.permissions.index.tsx` - Changed 301 → 307
- `/src/routes/app/_settings/_permissions/settings.dataset-groups.$datasetGroupId.index.tsx` - Changed 301 → 307
- `/src/routes/app/_settings/_restricted_layout/_admin_only.tsx` - Changed 301 → 307
- `/src/routes/app/_settings/_permissions.tsx` - Changed 301 → 307

### 2. Added Cache Control Headers
Modified `/src/middleware/global-security.ts` to add no-cache headers for redirect routes:
```typescript
if (isRedirectRoute) {
  headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  headers['Pragma'] = 'no-cache';
  headers['Expires'] = '0';
}
```

### 3. Meta Refresh with Cache Prevention
Updated `/src/routes/index.tsx` with cache prevention meta tags:
```typescript
meta: [
  { 'http-equiv': 'refresh', content: '0; url=/app/home' },
  { 'http-equiv': 'Cache-Control', content: 'no-cache, no-store, must-revalidate' },
  { 'http-equiv': 'Pragma', content: 'no-cache' },
  { 'http-equiv': 'Expires', content: '0' },
]
```

## 🧹 Clear Your Browser Cache

**For existing users who might have cached 301 redirects:**

### Chrome/Edge:
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Or Clear Specific Site Data:
1. Open DevTools → Application tab
2. Storage → Clear storage
3. Click "Clear site data"

### Firefox:
1. Ctrl+Shift+Delete
2. Select "Cache" only
3. Clear for "Last hour"

## 📊 Status Code Reference

| Code | Type | Cached? | Use Case |
|------|------|---------|----------|
| 301 | Permanent | ✅ Aggressively | Never for app redirects! |
| 302 | Temporary | ⚠️ Sometimes | Legacy, avoid |
| 303 | See Other | ❌ No | POST → GET redirect |
| 307 | Temporary | ❌ No | ✅ Best for app redirects |
| 308 | Permanent | ✅ Yes | Like 301 but preserves method |

## 🚀 Testing

1. **Clear browser cache first** (important!)
2. **Build and deploy:**
   ```bash
   npm run build
   npx wrangler deploy --env staging
   ```

3. **Test scenarios:**
   - Visit `/` → Should redirect to `/app/home`
   - Visit `/app/` → Should redirect to `/app/home`
   - Log out → Should redirect to `/auth/login`
   - All should work on first visit (cold start)

## 🎯 Key Takeaways

1. **Never use 301 for application redirects** - they're meant for permanent URL changes
2. **Use 307 for temporary redirects** that shouldn't be cached
3. **Browser caching can persist across deployments** and cause mysterious issues
4. **Incognito mode is your friend** for testing caching issues

## 🔮 Future Recommendations

1. **Consider server-side redirects** in Cloudflare configuration for static redirects
2. **Monitor with Chrome DevTools Network tab** - check "Disable cache" when debugging
3. **Use `wrangler tail` to see if requests are even hitting your worker**

## Related Issues
- [MDN: HTTP redirect status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#redirection_messages)
- [Chrome: Clear cache for specific site](https://support.google.com/chrome/answer/2392709)
- [Cloudflare: Page Rules for redirects](https://developers.cloudflare.com/rules/page-rules/)
