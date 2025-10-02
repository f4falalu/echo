import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/screenshots/_content')({
  component: RouteComponent,
  beforeLoad: async ({ matches }) => {
    //
  },
});

function RouteComponent() {
  return <Outlet />;
}
