import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/datasets/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/datasets/"!</div>;
}
