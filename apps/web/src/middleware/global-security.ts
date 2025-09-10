import { createMiddleware } from '@tanstack/react-start';
import { getWebRequest, setHeaders } from '@tanstack/react-start/server';
import { createSecurityHeaders } from './csp-helper';

export const securityMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    // Check if this is an embed route by examining the request URL
    const request = getWebRequest();
    const url = new URL(request.url);
    const isEmbed = url.pathname.startsWith('/embed/');

    // Check if this is a redirect route that might be cached
    const isRedirectRoute =
      url.pathname === '/' || url.pathname === '/app' || url.pathname === '/app/';

    // Set security headers BEFORE calling next() to ensure they're set only once
    const headers = createSecurityHeaders(isEmbed);

    // Add cache control headers for redirect routes to prevent caching issues
    if (isRedirectRoute) {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    }

    setHeaders(headers);

    const result = await next();
    return result;
  }
);
