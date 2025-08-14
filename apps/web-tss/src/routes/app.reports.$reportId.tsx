import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/reports/$reportId')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/reports/$reportId"!</div>;
}
