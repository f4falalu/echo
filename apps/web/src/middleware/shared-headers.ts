// Reasonable cache headers for HTML pages
export const htmlCacheHeaders = [
  { httpEquiv: 'Cache-Control', content: 'public, max-age=300, must-revalidate' }, // 5 minutes
  { httpEquiv: 'Pragma', content: 'cache' },
];
