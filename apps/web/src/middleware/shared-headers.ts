// Reasonable cache headers for HTML pages
export const htmlCacheHeaders = [
  { httpEquiv: 'Cache-Control', content: 'public, max-age=300, must-revalidate' }, // 5 minutes
  { httpEquiv: 'Pragma', content: 'cache' },
];

// Only use aggressive no-cache for specific routes that need it
export const preventBrowserCacheHeaders = [
  { httpEquiv: 'Cache-Control', content: 'no-cache, no-store, must-revalidate' },
  { httpEquiv: 'Pragma', content: 'no-cache' },
  { httpEquiv: 'Expires', content: '0' },
];
