import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/metrics/$metricId')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/metrics/$metricId"!</div>;
}
