import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

export const Route = createFileRoute('/auth/reset-password')({
  head: () => ({
    meta: [
      { title: 'Reset Password' },
      { name: 'description', content: 'Reset your Buster account password' },
      { name: 'og:title', content: 'Reset Password' },
      { name: 'og:description', content: 'Reset your Buster account password' },
    ],
  }),
  component: RouteComponent,
  validateSearch: z.object({
    email: z.string(),
  }),
});

function RouteComponent() {
  return <div>Hello "/auth/reset-password"!</div>;
}
