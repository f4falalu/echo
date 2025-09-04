import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_settings/_permissions/settings/users/$userId')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/_settings/_permissions/settings/users/$userId"!</div>;
}
