import { NextRequest } from 'next/server';
import { isEmbedPage } from './publicPageMiddleware';

const defaultCspHeader = {
  'Content-Security-Policy': [
    // Default directives
    "default-src 'self'",
    // Scripts
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel.app",
    // Styles
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Images
    "img-src 'self' blob: data: https://*.vercel.app https://*.supabase.co",
    // Fonts
    "font-src 'self' https://fonts.gstatic.com",
    // Frame ancestors - no embedding for non-embed routes
    "frame-ancestors 'none'",
    // Connect sources for API calls
    "connect-src 'self' https://*.vercel.app https://*.supabase.co wss://*.supabase.co",
    // Media
    "media-src 'self'",
    // Object
    "object-src 'none'",
    // Form actions
    "form-action 'self'",
    // Base URI
    "base-uri 'self'",
    // Manifest
    "manifest-src 'self'"
  ].join('; ')
};

const embedCspHeader = {
  'Content-Security-Policy': [
    // Default directives
    "default-src 'self'",
    // Scripts
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel.app",
    // Styles
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // Images
    "img-src 'self' blob: data: https://*.vercel.app https://*.supabase.co",
    // Fonts
    "font-src 'self' https://fonts.gstatic.com",
    // Frame ancestors - allow embedding from any domain for /embed routes
    `frame-ancestors 'self' *`,
    // Connect sources for API calls
    "connect-src 'self' https://*.vercel.app https://*.supabase.co wss://*.supabase.co",
    // Media
    "media-src 'self'",
    // Object
    "object-src 'none'",
    // Form actions
    "form-action 'self'",
    // Base URI
    "base-uri 'self'",
    // Manifest
    "manifest-src 'self'"
  ].join('; ')
};

export const cspPolicyMiddleware = (request: NextRequest) => {
  const isEmbedRoute = isEmbedPage(request);

  // Add CSP headers based on route
  request.headers.set(
    'Content-Security-Policy',
    (isEmbedRoute
      ? embedCspHeader['Content-Security-Policy']
      : defaultCspHeader['Content-Security-Policy']
    ).trim()
  );

  // Add additional security headers
  if (isEmbedRoute) {
    request.headers.set('X-Frame-Options', 'ALLOW-FROM *');
  } else {
    request.headers.set('X-Frame-Options', 'DENY');
  }
  request.headers.set('X-Content-Type-Options', 'nosniff');
  request.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  request.headers.set('frame-ancestors', '*');

  console.log('request.headers', isEmbedRoute ? 'embed' : 'default', request.headers);

  return request;
};
