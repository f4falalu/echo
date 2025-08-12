import { createFileRoute, redirect } from '@tanstack/react-router';
import { signOut } from '@/integrations/supabase/signOut';

export const Route = createFileRoute('/auth/logout')({
  preload: false,
  loader: async () => {
    await signOut();
    redirect({ to: '/auth/login' });
  },
});
