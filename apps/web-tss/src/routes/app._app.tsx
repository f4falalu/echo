import { createFileRoute, Outlet } from '@tanstack/react-router';
import { PrimaryAppLayout } from '@/layouts/PrimaryAppLayout';
import { Route as AppRoute } from '@/routes/app';

export const Route = createFileRoute('/app/_app')({
  component: () => {
    const { initialLayout } = AppRoute.useLoaderData();
    return (
      <PrimaryAppLayout initialLayout={initialLayout}>
        <Outlet />
      </PrimaryAppLayout>
    );
  },
});
