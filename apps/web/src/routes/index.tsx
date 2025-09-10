import { createFileRoute, redirect } from '@tanstack/react-router';
import * as React from 'react';
import { isServer } from '@/lib/window';

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [{ 'http-equiv': 'refresh', content: '0; url=/app/home' }],
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
  component: () => {
    const data = Route.useLoaderData();

    // Client-side redirect after hydration
    React.useEffect(() => {
      if (data?.shouldRedirect) {
        window.location.href = data.redirectTo;
      }
    }, [data]);

    return <div>Redirecting...</div>;
  },
});
