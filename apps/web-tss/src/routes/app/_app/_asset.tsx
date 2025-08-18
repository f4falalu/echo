import { createFileRoute, Outlet } from '@tanstack/react-router';
import { getTitle as getAssetTitle } from '@/api/buster_rest/title';

export const Route = createFileRoute('/app/_app/_asset')({
  context: () => {
    return {
      getAssetTitle,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <Outlet />
    </>
  );
}
