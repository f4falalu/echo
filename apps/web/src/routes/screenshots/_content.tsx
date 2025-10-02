import { createFileRoute, Outlet } from '@tanstack/react-router';
import { getWebRequest } from '@tanstack/react-start/server';
import { prefetchGetMyUserInfo } from '@/api/buster_rest/users';
import { env } from '@/env';
import { getSupabaseSession } from '@/integrations/supabase/getSupabaseUserClient';

export const Route = createFileRoute('/screenshots/_content')({
  ssr: true,
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    const user = await getSupabaseSession();
    await prefetchGetMyUserInfo(context.queryClient);
    return {
      user,
    };
  },
  loader: async ({ context }) => {
    const { user } = context;
    return {
      user,
    };
  },
});

function RouteComponent() {
  return <Outlet />;
}
