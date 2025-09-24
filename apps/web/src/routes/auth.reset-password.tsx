import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { ResetEmailForm } from '@/components/features/auth/ResetEmailForm';
import { ResetPasswordForm } from '@/components/features/auth/ResetPasswordForm';
import { useGetSupabaseUser } from '@/context/Supabase';

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
    email: z.string().optional(),
  }),
});

function RouteComponent() {
  const { email } = Route.useSearch();
  const supabaseUser = useGetSupabaseUser();

  if (email || supabaseUser?.is_anonymous || !supabaseUser) {
    return <ResetEmailForm queryEmail={email || ''} />;
  }

  return <ResetPasswordForm supabaseUser={supabaseUser} />;
}
