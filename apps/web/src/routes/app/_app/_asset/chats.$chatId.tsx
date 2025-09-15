import type { AssetType } from '@buster/server-shared/assets';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import omit from 'lodash/omit';
import { prefetchGetChat } from '@/api/buster_rest/chats';
import {
  chooseInitialLayout,
  getDefaultLayout,
  getDefaultLayoutMode,
} from '@/context/Chats/selected-mode-helpers';
import { ChatLayout } from '@/layouts/ChatLayout';

export const Route = createFileRoute('/app/_app/_asset/chats/$chatId')({
  beforeLoad: async ({ params, context }) => {
    const chatId = params.chatId;
    const assetParams = omit(params, 'chatId');
    const assetType = context.assetType;
    const autoSaveId = `chat-${chatId ? 'C' : 'NXC'}-${assetType ? 'Y' : 'NXA'}`;
    const selectedLayout = getDefaultLayoutMode({
      chatId,
      assetParams,
    });
    const defaultLayout = getDefaultLayout({
      layout: selectedLayout,
    });
    const chatLayout = await context.getAppLayout({ id: autoSaveId });

    const initialLayout = chooseInitialLayout({
      layout: selectedLayout,
      initialLayout: chatLayout,
      defaultLayout,
    });

    return {
      autoSaveId,
      initialLayout,
      defaultLayout,
      selectedLayout,
    };
  },
  loader: async ({ params, context }) => {
    const chatId = params.chatId;

    const [title] = await Promise.all([
      context.getAssetTitle({
        assetId: params.chatId,
        assetType: 'chat',
      }),
      prefetchGetChat({ id: chatId }, context.queryClient),
    ]);

    return {
      title,
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
    const { initialLayout, selectedLayout, autoSaveId, defaultLayout } = Route.useRouteContext();

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
