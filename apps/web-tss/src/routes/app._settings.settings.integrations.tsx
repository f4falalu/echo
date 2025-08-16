import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_settings/settings/integrations')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/_settings/settings/integrations"!</div>;
}
