export const preventBrowserCacheHeaders = [
  { httpEquiv: 'Cache-Control', content: 'no-cache, no-store, must-revalidate' },
  { httpEquiv: 'Pragma', content: 'no-cache' },
  { httpEquiv: 'Expires', content: '0' },
];
