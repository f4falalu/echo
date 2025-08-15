import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_settings/settings/profile')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/settings/profile"!</div>;
}
