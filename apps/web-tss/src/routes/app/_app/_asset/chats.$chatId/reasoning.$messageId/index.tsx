import { createFileRoute } from '@tanstack/react-router';
import { ReasoningController } from '@/controllers/ReasoningController/ReasoningController';

export const Route = createFileRoute('/app/_app/_asset/chats/$chatId/reasoning/$messageId/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { chatId, messageId } = Route.useParams();
  return <ReasoningController chatId={chatId} messageId={messageId} />;
}
