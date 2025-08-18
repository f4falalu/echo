import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_settings/app/settings/datasources/add')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/_settings/datasources/add"!</div>;
}
