import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_app/_asset/chats/$chatId/reasoning/$messageId')({
  component: RouteComponent,
  staticData: {
    assetType: 'reasoning',
  },
});

function RouteComponent() {
  return <div>Hello "/app/_app/_asset/chats/$chatId/reasoning/$messageId"!</div>;
}
