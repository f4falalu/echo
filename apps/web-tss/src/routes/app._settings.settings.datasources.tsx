import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_settings/settings/datasources')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/settings/datasources"!</div>;
}
