import type { AssetType } from '@buster/server-shared/assets';
import { createFileRoute, Outlet, useLoaderData } from '@tanstack/react-router';
import omit from 'lodash/omit';
import { getAppLayout } from '@/api/server-functions/getAppLayout';
import { ChatLayout } from '@/layouts/ChatLayout';
import {
  DEFAULT_CHAT_OPTION_SIDEBAR_SIZE,
  DEFAULT_FILE_OPTION_SIDEBAR_SIZE,
} from '@/layouts/ChatLayout/config';
import { getDefaultLayout } from '../../../../context/Chats/useSelectedLayoutMode';

export const Route = createFileRoute('/app/_app/_asset/chats/$chatId')({
  loader: async ({ params, context }) => {
    const chatId = params.chatId;
    const assetParams = omit(params, 'chatId');
    const assetType = context.assetType;
    const autoSaveId = `chat-splitter-${chatId || '🫥'}-${assetType || '❌'}`;

    const [chatLayout, title] = await Promise.all([
      getAppLayout({ data: { id: autoSaveId } }),
      context.getAssetTitle({
        assetId: params.chatId,
        assetType: 'chat',
      }),
    ]);
    const defaultLayout = getDefaultLayout({
      chatId,
      assetParams,
    });
    const initialLayout = chatLayout ?? defaultLayout;

    return {
      title,
      autoSaveId,
      initialLayout,
      defaultLayout,
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
    const { initialLayout, autoSaveId, defaultLayout } = Route.useLoaderData();
    return (
      <ChatLayout
        initialLayout={initialLayout}
        autoSaveId={autoSaveId}
        defaultLayout={defaultLayout}
      >
        <Outlet />
      </ChatLayout>
    );
  },
  staticData: {
    assetType: 'chat' as Extract<AssetType, 'chat'>,
  },
});
