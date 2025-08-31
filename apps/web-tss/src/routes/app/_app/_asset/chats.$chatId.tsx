import type { AssetType } from '@buster/server-shared/assets';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import omit from 'lodash/omit';
import { getAppLayout } from '@/api/server-functions/getAppLayout';
import {
  chooseInitialLayout,
  getDefaultLayout,
  getDefaultLayoutMode,
} from '@/context/Chats/selected-mode-helpers';
import { ChatLayout } from '@/layouts/ChatLayout';
import { prefetchGetChat } from '../../../../api/buster_rest/chats';

export const Route = createFileRoute('/app/_app/_asset/chats/$chatId')({
  loader: async ({ params, context }) => {
    const chatId = params.chatId;
    const assetParams = omit(params, 'chatId');
    const assetType = context.assetType;
    const autoSaveId = `chat-${chatId ? 'C' : 'X'}-${assetType ? 'Y' : 'N'}`;
    const selectedLayout = getDefaultLayoutMode({
      chatId,
      assetParams,
    });
    const defaultLayout = getDefaultLayout({
      layout: selectedLayout,
    });

    const [chatLayout, title, chat] = await Promise.all([
      getAppLayout({ data: { id: autoSaveId } }),
      context.getAssetTitle({
        assetId: params.chatId,
        assetType: 'chat',
      }),
      prefetchGetChat({ id: chatId }, context.queryClient),
    ]);

    const initialLayout = chooseInitialLayout({
      layout: selectedLayout,
      initialLayout: chatLayout,
      defaultLayout,
    });

    return {
      title,
      autoSaveId,
      initialLayout,
      defaultLayout,
      selectedLayout,
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.title || 'Chat' },
      { name: 'description', content: 'View and interact with your chat conversation' },
      { name: 'og:title', content: 'Chat' },
      { name: 'og:description', content: 'View and interact with your chat conversation' },
    ],
  }),
  component: () => {
    const { initialLayout, selectedLayout, autoSaveId, defaultLayout } = Route.useLoaderData();

    return (
      <ChatLayout
        initialLayout={initialLayout}
        autoSaveId={autoSaveId}
        defaultLayout={defaultLayout}
        selectedLayout={selectedLayout}
      >
        <Outlet />
      </ChatLayout>
    );
  },
  staticData: {
    assetType: 'chat' as Extract<AssetType, 'chat'>,
  },
});
