import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_app/chats/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/chats"!</div>;
}
