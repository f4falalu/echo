import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_app/_asset/chats/$chatId/')({
  component: RouteComponent,
});

function RouteComponent() {
  return null;
}
