import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { AppProviders } from '../context/Providers';
import { PRIMARY_APP_LAYOUT_ID, PrimaryAppLayout } from '../layouts/PrimaryAppLayout';
import { getAppLayout } from '../serverFns/getAppLayout';

export const Route = createFileRoute('/app')({
  beforeLoad: async ({ context, location }) => {
    const hasUser = context.user;
    const isAnonymous = context.user?.is_anonymous;
    if (!hasUser || isAnonymous) {
      throw redirect({ to: '/auth/login' });
    }

    // Only redirect if landing directly on /app (not on nested routes)
    if (location.pathname === '/app') {
      throw redirect({ to: '/app/home' });
    }
  },

  loader: async () => {
    const initialLayout = await getAppLayout({ data: { id: PRIMARY_APP_LAYOUT_ID } });
    return {
      initialLayout,
    };
  },
  component: () => {
    const { initialLayout } = Route.useLoaderData();
    return (
      <AppProviders>
        <PrimaryAppLayout initialLayout={initialLayout}>
          <Outlet />
        </PrimaryAppLayout>
      </AppProviders>
    );
  },
});
