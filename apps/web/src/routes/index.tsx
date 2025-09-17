import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    throw redirect({ to: '/app/home', replace: true });
  },
  component: () => null,
});
