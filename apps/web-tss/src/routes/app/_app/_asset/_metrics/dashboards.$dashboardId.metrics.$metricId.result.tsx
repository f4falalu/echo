import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/app/_app/_asset/_metrics/dashboards/$dashboardId/metrics/$metricId/result'
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/_app/_asset/dashboards/$dashboardId/metrics/$metricId/result"!</div>;
}
