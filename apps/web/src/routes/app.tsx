import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { prefetchListDatasources } from '@/api/buster_rest/data_source';
import { prefetchGetDatasets } from '@/api/buster_rest/datasets';
import { prefetchGetUserFavorites } from '@/api/buster_rest/users/favorites/queryRequests';
import { prefetchGetMyUserInfo } from '@/api/buster_rest/users/queryRequests';
import { getAppLayout } from '@/api/server-functions/getAppLayout';
import { AppProviders } from '@/context/Providers';
import { getSupabaseSession, getSupabaseUser } from '@/integrations/supabase/getSupabaseUserClient';
import type { LayoutSize } from '../components/ui/layouts/AppLayout';

const PRIMARY_APP_LAYOUT_ID = 'primary-sidebar';
const DEFAULT_LAYOUT: LayoutSize = ['230px', 'auto'];

export const Route = createFileRoute('/app')({
  context: ({ context }) => ({ ...context, getAppLayout }),
  ssr: true,
  beforeLoad: async () => {
    console.log('beforeLoad app route');
    const { isExpired, accessToken = '' } = await getSupabaseSession();
    console.log('beforeLoad app route done');

    if (isExpired || !accessToken) {
      console.error('Access token is expired or not found');
      throw redirect({ to: '/auth/login', replace: true });
    }

    return {
      accessToken,
    };
  },
  loader: async ({ context }) => {
    const { queryClient, accessToken } = context;
    try {
      console.log('loading app route');
      const [initialLayout, user] = await Promise.all([
        getAppLayout({ id: PRIMARY_APP_LAYOUT_ID }),
        getSupabaseUser(),
        prefetchGetMyUserInfo(queryClient),
        prefetchGetUserFavorites(queryClient),
        prefetchListDatasources(queryClient),
        prefetchGetDatasets(queryClient),
      ]);
      console.log('app route loaded', user);

      if (!user) {
        throw redirect({ to: '/auth/login', replace: true });
      }

      return {
        initialLayout,
        layoutId: PRIMARY_APP_LAYOUT_ID,
        defaultLayout: DEFAULT_LAYOUT,
        accessToken,
        user,
      };
    } catch (error) {
      console.error('Error in app route loader:', error);
      throw redirect({ to: '/auth/login', replace: true });
    }
  },
  component: () => {
    const { user, accessToken } = Route.useLoaderData();

    return (
      <AppProviders user={user} accessToken={accessToken}>
        <Outlet />
      </AppProviders>
    );
  },
});
