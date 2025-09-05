import { createMiddleware } from '@tanstack/react-start';
import { getWebRequest, setHeaders } from '@tanstack/react-start/server';
import { createSecurityHeaders } from './csp-helper';

export const securityMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const result = await next();

    // Check if this is an embed route by examining the request URL
    const request = getWebRequest();
    const url = new URL(request.url);
    const isEmbed = url.pathname.startsWith('/embed/');

    // Set security headers for all server function responses using shared helper
    setHeaders(createSecurityHeaders(isEmbed));

    return result;
  }
);
