import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { prefetchGetMyUserInfo } from '@/api/buster_rest/users';
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
    email: z.string(),
  }),
  loader: async ({ context }) => {
    const user = await prefetchGetMyUserInfo(context.queryClient);
    return {
      user,
    };
  },
});

function RouteComponent() {
  const { user } = Route.useLoaderData();
  const { email } = Route.useSearch();
  const supabaseUser = useGetSupabaseUser();

  if (email) {
    return <ResetEmailForm queryEmail={email} />;
  }

  if (!supabaseUser || !user) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-10">
        We were unable to find your account
      </div>
    );
  }

  return <ResetPasswordForm supabaseUser={supabaseUser} busterUser={user} />;
}
