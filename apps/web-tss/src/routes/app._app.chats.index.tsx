import { createFileRoute } from '@tanstack/react-router';
import { AppPageLayout } from '@/components/ui/layouts/AppPageLayout';
import { ChatListContainer } from '@/controllers/ChatsListController/ChatListController';
import { ChatListHeader } from '@/controllers/ChatsListController/ChatListHeader';

export const Route = createFileRoute('/app/_app/chats/')({
  head: () => ({
    meta: [
      { title: 'Chats' },
      { name: 'description', content: 'Browse and manage your chat conversations' },
      { name: 'og:title', content: 'Chats' },
      { name: 'og:description', content: 'Browse and manage your chat conversations' },
    ],
  }),
  component: RouteComponent,
});

const type = 'chats';

function RouteComponent() {
  return (
    <AppPageLayout headerSizeVariant="list" header={<ChatListHeader type={type} />}>
      <ChatListContainer type={type} />
    </AppPageLayout>
  );
}
