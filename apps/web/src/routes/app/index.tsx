import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/app/')({
  beforeLoad: async () => {
    console.log('before load redirecting to app home');
    throw redirect({ to: '/app/home' });
  },
});
