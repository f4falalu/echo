import { createFileRoute, getRouteApi, Outlet } from '@tanstack/react-router';
import { getTitle as getAssetTitle } from '@/api/buster_rest/title';
import { PrimaryAppLayout } from '@/layouts/PrimaryAppLayout';

const routeApi = getRouteApi('/app');

export const Route = createFileRoute('/app/_app')({
  context: () => {
    return {
      getAssetTitle,
    };
  },
  component: () => {
    const { initialLayout, defaultLayout, layoutId } = routeApi.useLoaderData();
    return (
      <PrimaryAppLayout
        initialLayout={initialLayout}
        layoutId={layoutId}
        defaultLayout={defaultLayout}
      >
        <Outlet />
      </PrimaryAppLayout>
    );
  },
});
