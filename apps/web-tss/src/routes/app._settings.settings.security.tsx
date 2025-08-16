import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_settings/settings/security')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/_settings/settings/security"!</div>;
}
