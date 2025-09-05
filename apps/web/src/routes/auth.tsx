import { createFileRoute, Outlet } from '@tanstack/react-router';
import { AuthLayout } from '@/components/features/auth/AuthLayout';

// Layout route for all /auth/* pages
// Wraps auth pages in a centered container with room for branding and future UI
export const Route = createFileRoute('/auth')({
  head: () => ({
    meta: [
      { title: 'Authentication' },
      { name: 'description', content: 'Buster authentication pages' },
      { name: 'og:title', content: 'Authentication' },
      { name: 'og:description', content: 'Buster authentication pages' },
    ],
  }),
  component: () => (
    <AuthLayout>
      <Outlet />
    </AuthLayout>
  ),
});
