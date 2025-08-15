import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_app/dashboards/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/dashboads"!</div>;
}
