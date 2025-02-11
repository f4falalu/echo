import React from 'react';
import {
  createContext,
  ContextSelector,
  useContextSelector
} from '@fluentui/react-context-selector';
import { useMemoizedFn } from 'ahooks';
import type { BusterSearchResult, FileType } from '@/api/asset_interfaces';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { useChatUpdateMessage } from './useChatUpdateMessage';

export const useBusterNewChat = () => {
  const busterSocket = useBusterWebSocket();

  const {
    completeChatCallback,
    startListeningForChatProgress,
    stopListeningForChatProgress,
    stopChatCallback
  } = useChatUpdateMessage();

  const onSelectSearchAsset = useMemoizedFn(async (asset: BusterSearchResult) => {
    console.log('select search asset');
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  const onStartNewChat = useMemoizedFn(async (prompt: string) => {
    console.log('start new chat');
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  const onStartChatFromFile = useMemoizedFn(
    async ({}: { prompt: string; fileId: string; fileType: FileType }) => {
      console.log('start chat from file');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  );

  const onReplaceMessageInChat = useMemoizedFn(
    async ({ prompt, messageId }: { prompt: string; messageId: string }) => {
      console.log('replace message in chat');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  );

  const onFollowUpChat = useMemoizedFn(
    async ({ prompt, chatId }: { prompt: string; chatId: string }) => {
      startListeningForChatProgress();
      const result = await busterSocket.emitAndOnce({
        emitEvent: {
          route: '/chats/post',
          payload: {
            dataset_id: null,
            prompt,
            chat_id: chatId
          }
        },
        responseEvent: {
          route: '/chats/post:complete',
          callback: completeChatCallback
        }
      });

      stopListeningForChatProgress();
    }
  );

  const onStopChat = useMemoizedFn(
    ({ chatId, messageId }: { chatId: string; messageId: string }) => {
      busterSocket.emit({
        route: '/chats/stop',
        payload: {
          id: chatId,
          message_id: messageId
        }
      });
      stopListeningForChatProgress();
      stopChatCallback(chatId);
    }
  );

  return {
    onStartNewChat,
    onSelectSearchAsset,
    onFollowUpChat,
    onStartChatFromFile,
    onReplaceMessageInChat,
    onStopChat
  };
};

export const BusterNewChatContext = createContext<ReturnType<typeof useBusterNewChat>>(
  {} as ReturnType<typeof useBusterNewChat>
);

export const BusterNewChatProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const value = useBusterNewChat();
  return <BusterNewChatContext.Provider value={value}>{children}</BusterNewChatContext.Provider>;
};

export const useBusterNewChatContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useBusterNewChat>, T>
) => useContextSelector(BusterNewChatContext, selector);
