import { createFileRoute } from '@tanstack/react-router';
import { AppPageLayout } from '@/components/ui/layouts/AppPageLayout';
import { ChatListContainer } from '@/controllers/ChatsListController/ChatListController';
import { ChatListHeader } from '@/controllers/ChatsListController/ChatListHeader';

export const Route = createFileRoute('/app/_app/logs/')({
  head: () => ({
    meta: [
      { title: 'Logs' },
      { name: 'description', content: 'View system and application logs' },
      { name: 'og:title', content: 'Logs' },
      { name: 'og:description', content: 'View system and application logs' },
    ],
  }),
  component: RouteComponent,
});

const type = 'logs';

function RouteComponent() {
  return (
    <AppPageLayout headerSizeVariant="list" header={<ChatListHeader type={type} />}>
      <ChatListContainer type={type} />
    </AppPageLayout>
  );
}
