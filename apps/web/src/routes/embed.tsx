import { QueryClient } from '@tanstack/react-query';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { prefetchGetMyUserInfo } from '@/api/buster_rest/users';
import { getSupabaseSession } from '@/integrations/supabase/getSupabaseUserClient';

export const Route = createFileRoute('/embed')({
  beforeLoad: async ({ context }) => {
    const user = await prefetchGetMyUserInfo(context.queryClient);
    console.log('user', user);
    const supabaseSession = await getSupabaseSession();

    console.log('supabaseSession', supabaseSession);
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
