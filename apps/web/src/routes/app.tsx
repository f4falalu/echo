import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { prefetchGetMyUserInfo } from '@/api/buster_rest/users/queryRequests';
import { getAppLayout } from '@/api/server-functions/getAppLayout';
import { AppProviders } from '@/context/Providers';
import { getSupabaseSession } from '@/integrations/supabase/getSupabaseUserClient';
import { preventBrowserCacheHeaders } from '@/middleware/shared-headers';

export const Route = createFileRoute('/app')({
  head: () => {
    return {
      meta: [...preventBrowserCacheHeaders],
    };
  },
  context: ({ context }) => ({ ...context, getAppLayout }),
  beforeLoad: async () => {
    try {
      console.log('app route beforeLoad', typeof window !== 'undefined', import.meta.env.SSR);
      const supabaseSession = await getSupabaseSession();
      const { isExpired, accessToken = '' } = supabaseSession;
      if (isExpired || !accessToken) {
        console.error('Access token is expired or not found');
        throw redirect({ to: '/auth/login', replace: true, statusCode: 307 });
      }
      return {
        supabaseSession,
      };
    } catch (error) {
      console.error('Error in app route beforeLoad:', error);
      throw redirect({ to: '/auth/login', replace: true, statusCode: 307 });
    }
  },
  loader: async ({ context }) => {
    const { queryClient, supabaseSession } = context;
    try {
      await Promise.all([prefetchGetMyUserInfo(queryClient)]);

      return {
        supabaseSession,
      };
    } catch (error) {
      console.error('Error in app route loader:', error);
      throw redirect({ to: '/auth/login', replace: true, statusCode: 307 });
    }
  },
  component: () => {
    const { supabaseSession } = Route.useLoaderData();

    return (
      <AppProviders supabaseSession={supabaseSession}>
        <Outlet />
      </AppProviders>
    );
  },
});
