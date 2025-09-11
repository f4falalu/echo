import { createMiddleware } from '@tanstack/react-start';
import { getWebRequest, setHeaders } from '@tanstack/react-start/server';
import { createSecurityHeaders } from './csp-helper';

export const securityMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    // Check if this is an embed route by examining the request URL
    const request = getWebRequest();
    const url = new URL(request.url);
    const isEmbed = url.pathname.startsWith('/embed');

    setHeaders(createSecurityHeaders(isEmbed));

    // Set appropriate cache headers for static assets
    const pathname = url.pathname;
    if (
      pathname.endsWith('.ico') ||
      pathname.endsWith('.png') ||
      pathname.endsWith('.jpg') ||
      pathname.endsWith('.jpeg') ||
      pathname.endsWith('.gif') ||
      pathname.endsWith('.svg') ||
      pathname.endsWith('.woff') ||
      pathname.endsWith('.woff2') ||
      pathname.endsWith('.ttf') ||
      pathname.endsWith('.eot')
    ) {
      // Static assets with hashed filenames can be cached for 1 year
      setHeaders({
        'Cache-Control': 'public, max-age=31536000, immutable', // 1 year
      });
    } else if (pathname === '/manifest.json') {
      // Manifest can be cached for a shorter time
      setHeaders({
        'Cache-Control': 'public, max-age=86400', // 1 day
      });
    }

    const result = await next();
    return result;
  }
);
