import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    console.log('redirecting to /app/home');
    throw redirect({ to: '/app/home', replace: true, statusCode: 302 });
  },
  component: () => null,
});
