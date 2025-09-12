// Reasonable cache headers for HTML pages
export const htmlCacheHeaders = [
  { httpEquiv: 'Cache-Control', content: 'public, max-age=300, must-revalidate' }, // 5 minutes
  { httpEquiv: 'Pragma', content: 'cache' },
];

// Use less aggressive caching to work better with Cloudflare
export const preventBrowserCacheHeaders = [
  { httpEquiv: 'Cache-Control', content: 'public, max-age=0, must-revalidate' },
  { httpEquiv: 'Pragma', content: 'no-cache' },
];
