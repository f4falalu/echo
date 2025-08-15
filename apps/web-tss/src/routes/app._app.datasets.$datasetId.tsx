import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_app/datasets/$datasetId')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/datasets/$datasetId"!</div>;
}
