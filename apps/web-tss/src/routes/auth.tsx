import { createFileRoute, Outlet } from '@tanstack/react-router';
import { AuthLayout } from '@/components/features/auth/AuthLayout';

// Layout route for all /auth/* pages
// Wraps auth pages in a centered container with room for branding and future UI
export const Route = createFileRoute('/auth')({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Buster — Auth',
      },
    ],
  }),
  component: () => <AuthLayout>{<Outlet />}</AuthLayout>,
});
