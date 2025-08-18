import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_app/_asset/dashboards/$dashboardId/metrics/$metricId')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/_app/dashboards/$dashboardId/metrics/$metricId"!</div>;
}
