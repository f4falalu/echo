import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_app/reports/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/reports/"!</div>;
}
