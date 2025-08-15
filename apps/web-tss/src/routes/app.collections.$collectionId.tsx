import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/collections/$collectionId')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/collection/$collectionId"!</div>;
}
