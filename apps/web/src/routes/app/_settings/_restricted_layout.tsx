import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_settings/_restricted_layout')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex items-center justify-center px-5 pt-16">
      <div className="w-full max-w-[630px] min-w-[500px]">
        <Outlet />
      </div>
    </div>
  );
}
