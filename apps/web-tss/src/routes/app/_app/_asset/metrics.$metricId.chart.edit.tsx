import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_app/_asset/metrics/$metricId/chart/edit')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/_app/_asset/metrics/$metricId/chart/edit"!</div>;
}
