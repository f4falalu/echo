import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { prefetchGetUserFavorites } from '@/api/buster_rest/users/favorites/queryRequests';
import { prefetchGetMyUserInfo } from '@/api/buster_rest/users/queryRequests';
import { getAppLayout } from '@/api/server-functions/getAppLayout';
import { AppProviders } from '@/context/Providers';
import { embedAssetToRegularAsset } from '@/context/Routes/embedAssetToRegularAsset';
import type { LayoutSize } from '../components/ui/layouts/AppLayout';

const PRIMARY_APP_LAYOUT_ID = 'primary-sidebar';
const DEFAULT_LAYOUT: LayoutSize = ['230px', 'auto'];

export const Route = createFileRoute('/app')({
  beforeLoad: async ({ context, matches }) => {
    const hasUser = context.user;
    const isAnonymous = context.user?.is_anonymous;

    if (!hasUser || isAnonymous) {
      const isAssetRoute = matches.some((match) => match.routeId === '/app/_app/_asset');
      if (isAssetRoute) {
        const route = embedAssetToRegularAsset(matches);
        if (route) {
          throw redirect(route);
        }
      }
      throw redirect({ to: '/auth/login' });
    }

    // Only redirect if landing directly on /app (not on nested routes)
    if (matches.length === 2 && matches[1].fullPath === '/app') {
      throw redirect({ to: '/app/home' });
    }
  },
  loader: async ({ context }) => {
    const { queryClient } = context;
    const [initialLayout] = await Promise.all([
      getAppLayout({ data: { id: PRIMARY_APP_LAYOUT_ID } }),
      prefetchGetMyUserInfo(queryClient),
      prefetchGetUserFavorites(queryClient),
    ]);
    return {
      initialLayout,
      layoutId: PRIMARY_APP_LAYOUT_ID,
      defaultLayout: DEFAULT_LAYOUT,
    };
  },
  component: () => {
    return (
      <AppProviders>
        <Outlet />
      </AppProviders>
    );
  },
});
