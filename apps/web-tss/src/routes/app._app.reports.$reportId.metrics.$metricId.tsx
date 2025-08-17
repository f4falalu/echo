import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_app/reports/$reportId/metrics/$metricId')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/_app/reports/$reportId/metrics/$metricId"!</div>;
}
