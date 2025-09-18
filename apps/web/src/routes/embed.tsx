import { createFileRoute, Outlet } from '@tanstack/react-router';
import { prefetchGetMyUserInfo } from '@/api/buster_rest/users';
import { signInWithAnonymousUser } from '@/integrations/supabase/signIn';

export const Route = createFileRoute('/embed')({
  beforeLoad: async ({ context }) => {
    const user = await prefetchGetMyUserInfo(context.queryClient);
    if (!user) await signInWithAnonymousUser(); //we fallback to an anonymous user
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
