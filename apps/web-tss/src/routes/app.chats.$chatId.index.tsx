import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/app/chats/$chatId/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/chats/$chatId"!</div>;
}
