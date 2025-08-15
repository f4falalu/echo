import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/settings/datasources')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/settings/datasources"!</div>;
}
