import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    console.log('before load redirecting to app');
    throw redirect({ to: '/app/home' });
  },
});
