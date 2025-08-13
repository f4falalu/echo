import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { AppProviders } from '../context/Providers';

export const Route = createFileRoute('/app')({
  beforeLoad: async ({ context, location }) => {
    const hasUser = context.user;
    const isAnonymous = context.user?.is_anonymous;
    if (!hasUser || isAnonymous) {
      throw redirect({ to: '/auth/login' });
    }

    // Only redirect if landing directly on /app (not on nested routes)
    if (location.pathname === '/app') {
      throw redirect({ to: '/app/home' });
    }
  },
  component: () => {
    return (
      <AppProviders>
        <Outlet />
      </AppProviders>
    );
  },
});
