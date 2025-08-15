import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_app/metrics/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/metrics/"!</div>;
}
