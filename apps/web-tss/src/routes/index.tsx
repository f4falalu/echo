import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: async ({ context }) => {
    const hasUser = context.user;
    const isAnonymous = context.user?.is_anonymous;
    if (!hasUser || isAnonymous) {
      throw redirect({ to: '/auth/login' });
    }

    throw redirect({ to: '/app/home' });
  },
});
