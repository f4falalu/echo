export const preventBrowserCacheHeaders = [
  { 'http-equiv': 'Cache-Control', content: 'no-cache, no-store, must-revalidate' },
  { 'http-equiv': 'Pragma', content: 'no-cache' },
  { 'http-equiv': 'Expires', content: '0' },
];
