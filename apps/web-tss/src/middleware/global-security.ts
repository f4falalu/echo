import { createMiddleware } from '@tanstack/react-start';
import { getHeaders, getWebRequest, setHeaders } from '@tanstack/react-start/server';
import { env } from '@/env';

// Function to create CSP header with dynamic API URLs
const createCspHeader = (isEmbed = false) => {
  const apiUrl = new URL(env.VITE_PUBLIC_API_URL).origin;
  const api2Url = new URL(env.VITE_PUBLIC_API2_URL).origin;
  const profilePictureURL = 'https://googleusercontent.com';
  const publicUrlOrigin = new URL(env.VITE_PUBLIC_URL).origin;

  // Derive Supabase origins (HTTP and WS) from env so CSP allows them in all modes
  const supabaseUrl = env.VITE_PUBLIC_SUPABASE_URL;
  const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : '';
  const supabaseWsOrigin = supabaseUrl
    ? supabaseUrl.startsWith('https')
      ? supabaseOrigin.replace('https', 'wss')
      : supabaseOrigin.replace('http', 'ws')
    : '';

  const isDev = import.meta.env.DEV;
  const localDomains = isDev
    ? 'http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*'
    : '';

  return [
    // Default directives
    "default-src 'self'",
    // Scripts
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel.app https://cdn.jsdelivr.net https://*.cloudflareinsights.com https://*.posthog.com",
    // Styles
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    // Images
    "img-src 'self' blob: data: https: http:",
    // Fonts
    "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
    // Frame ancestors - allow framing in development, restrict in production
    isEmbed
      ? `frame-ancestors 'self' *`
      : isDev
        ? `frame-ancestors 'self' *`
        : "frame-ancestors 'none'",
    // Frame sources - allow embeds from accepted domains
    `frame-src 'self' https://vercel.live https://*.twitter.com https://twitter.com https://*.x.com https://x.com https://*.youtube.com https://youtube.com https://*.youtube-nocookie.com https://youtube-nocookie.com https://*.youtu.be https://youtu.be https://*.vimeo.com https://vimeo.com ${publicUrlOrigin}`,
    // Connect sources for API calls
    (() => {
      const connectSources = [
        "'self'",
        'data:', // Allow data URLs for PDF exports and other data URI downloads
        localDomains,
        supabaseOrigin,
        supabaseWsOrigin,
        'https://*.vercel.app',
        'https://*.supabase.co',
        'wss://*.supabase.co',
        'https://*.posthog.com',
        'https://*.slack.com',
        // Social media and video platform APIs for embeds
        'https://*.twitter.com',
        'https://twitter.com',
        'https://*.x.com',
        'https://x.com',
        'https://*.youtube.com',
        'https://youtube.com',
        'https://*.youtube-nocookie.com',
        'https://youtube-nocookie.com',
        'https://*.youtu.be',
        'https://youtu.be',
        'https://*.vimeo.com',
        'https://vimeo.com',
        apiUrl,
        api2Url,
        profilePictureURL,
      ]
        .map((source) => source.replace(/\s+/g, ' ').trim())
        .filter(Boolean);

      return `connect-src ${connectSources.join(' ')}`;
    })(),
    // Media - allow media content from accepted domains
    "media-src 'self' https://*.twitter.com https://twitter.com https://*.x.com https://x.com https://*.youtube.com https://youtube.com https://*.youtube-nocookie.com https://youtube-nocookie.com https://*.youtu.be https://youtu.be https://*.vimeo.com https://vimeo.com",
    // Object
    "object-src 'none'",
    // Form actions
    "form-action 'self' https://*.slack.com",
    // Base URI
    "base-uri 'self'",
    // Manifest
    "manifest-src 'self'",
    // Worker sources
    "worker-src 'self' blob: data:",
    // Child sources
    "child-src 'self' blob: data:",
  ].join('; ');
};

export const securityMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const result = await next();

    // Check if this is an embed route by examining the request URL
    const request = getWebRequest();
    const url = new URL(request.url);
    const isEmbed = url.pathname.startsWith('/embed/');

    console.log(request);

    // Set security headers for all server function responses
    setHeaders({
      // Content Security Policy using your comprehensive policy
      // Use different CSP for embed routes vs regular routes
      'Content-Security-Policy': createCspHeader(isEmbed),

      // Other security headers
      // For embed routes, allow framing; for regular routes, deny framing
      'X-Frame-Options': isEmbed ? 'SAMEORIGIN' : 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-XSS-Protection': '1; mode=block',
      'Permissions-Policy': 'microphone=()',
    });

    return result;
  }
);
