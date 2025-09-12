import { createFileRoute, redirect } from '@tanstack/react-router';
import { signOut } from '@/integrations/supabase/signOut';

export const Route = createFileRoute('/auth/logout')({
  head: () => ({
    meta: [
      { title: 'Logout' },
      { name: 'description', content: 'Logout from your Buster account' },
      { name: 'og:title', content: 'Logout' },
      { name: 'og:description', content: 'Logout from your Buster account' },
    ],
  }),
  preload: false,
  loader: async () => {
    await signOut();
    throw redirect({ to: '/auth/login', statusCode: 307 });
  },
});
