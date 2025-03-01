import { AppPageLayout } from '@/components/ui/layouts/AppPageLayout';
import { ChatListContainer } from './_ChatsListContainer';
import { ChatListHeader } from './_ChatsListContainer/ChatListHeader';

export default function ChatsPage() {
  return (
    <AppPageLayout headerVariant="list" header={<ChatListHeader />}>
      <ChatListContainer />
    </AppPageLayout>
  );
}
