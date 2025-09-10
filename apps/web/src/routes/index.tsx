import { createFileRoute, redirect } from '@tanstack/react-router';
import * as React from 'react';
import { isServer } from '@/lib/window';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { 'http-equiv': 'refresh', content: '0; url=/app/home' },
      { 'http-equiv': 'Cache-Control', content: 'no-cache, no-store, must-revalidate' },
      { 'http-equiv': 'Pragma', content: 'no-cache' },
      { 'http-equiv': 'Expires', content: '0' },
    ],
  }),
  beforeLoad: async () => {
    // Only redirect on client-side to avoid SSR issues during cold starts
    if (!isServer) {
      throw redirect({ to: '/app/home', replace: true });
    }
  },
  loader: async () => {
    // Server-side: Return data indicating a redirect is needed
    if (isServer) {
      return { shouldRedirect: true, redirectTo: '/app/home' };
    }
    return {};
  },
  component: () => null,
});
