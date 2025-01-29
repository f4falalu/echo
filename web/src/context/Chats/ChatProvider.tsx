import React, { useEffect, useRef, useTransition } from 'react';
import {
  createContext,
  ContextSelector,
  useContextSelector
} from '@fluentui/react-context-selector';
import { useBusterWebSocket } from '../BusterWebSocket';
import type { BusterChatAsset, BusterChat, BusterChatMessage } from '@/api/buster_socket/chats';
import { useMemoizedFn, useUnmount } from 'ahooks';
import type { FileType } from '@/api/buster_socket/chats';
import { createMockResponseMessageThought, MOCK_CHAT } from './MOCK_CHAT';
import { IBusterChat } from './interfaces';
import { chatUpgrader } from './helpers';
import { useHotkeys } from 'react-hotkeys-hook';
import { fi } from '@faker-js/faker';

export const useBusterChat = () => {
  const busterSocket = useBusterWebSocket();
  const [isPending, startTransition] = useTransition();
  const chatsRef = useRef<Record<string, IBusterChat>>({});

  // GETTERS

  // SETTERS

  // LISTENERS

  const _onGetChat = useMemoizedFn((chat: BusterChat): IBusterChat => {
    const upgradedChat = chatUpgrader(chat);
    chatsRef.current[chat.id] = upgradedChat;
    startTransition(() => {
      //just used to trigger UI update
    });
    return upgradedChat;
  });

  const _onGetChatAsset = useMemoizedFn((asset: BusterChatAsset) => {
    const { id, type } = asset;
    console.log('TODO: handle this. Put the asset in their respective chat');
    return asset;
  });

  // EMITTERS

  const unsubscribeFromChat = useMemoizedFn(({ chatId }: { chatId: string }) => {
    return busterSocket.emit({
      route: '/chats/unsubscribe',
      payload: {
        id: chatId
      }
    });
  });

  const subscribeToChat = useMemoizedFn(({ chatId }: { chatId: string }) => {
    _onGetChat(MOCK_CHAT);
    // return busterSocket.emitAndOnce({
    //   emitEvent: {
    //     route: '/chats/get',
    //     payload: { id: chatId }
    //   },
    //   responseEvent: {
    //     route: '/chats/get:getChat',
    //     callback: _onGetChat
    //   }
    // });
  });

  const getChatAsset = useMemoizedFn(
    ({
      chatId: chat_id,
      assetId: asset_id,
      type,
      versionId: version_id
    }: {
      chatId?: string;
      assetId: string;
      type: FileType;
      versionId?: string;
    }) => {
      return busterSocket.emitAndOnce({
        emitEvent: {
          route: '/chats/get/asset',
          payload: {
            type,
            chat_id,
            asset_id,
            version_id
          }
        },
        responseEvent: {
          route: '/chats/get:getChatAsset',
          callback: _onGetChatAsset
        }
      });
    }
  );

  useHotkeys('z', () => {
    const chatId = Object.keys(chatsRef.current)[0];
    if (chatId) {
      const chat = chatsRef.current[chatId];
      const mockMessage = createMockResponseMessageThought();
      const newChat = { ...chat };
      const firstMessage = {
        ...newChat.messages[0],
        isCompletedStream: false,
        response_messages: [...newChat.messages[0].response_messages, mockMessage]
      };
      newChat.messages = [firstMessage];
      chatsRef.current[chatId] = newChat;
      startTransition(() => {
        //just used to trigger UI update
      });
    }
  });

  useHotkeys('f', () => {
    const chatId = Object.keys(chatsRef.current)[0];
    if (chatId) {
      const chat = chatsRef.current[chatId];

      const newChat = { ...chat };
      const firstMessage = newChat.messages[0];
      const updatedResponseMessages = firstMessage.response_messages.map((msg) => {
        if (msg.type === 'thought') {
          return {
            ...msg,
            hidden: true
          };
        }
        return msg;
      });

      const updatedMessage = {
        ...firstMessage,
        response_messages: updatedResponseMessages
      };

      newChat.messages = [updatedMessage];
      chatsRef.current[chatId] = newChat;
      startTransition(() => {
        // Trigger UI update
      });
    }
  });

  return {
    chats: chatsRef.current,
    unsubscribeFromChat,
    subscribeToChat,
    getChatAsset
  };
};

const BusterChat = createContext<ReturnType<typeof useBusterChat>>(
  {} as ReturnType<typeof useBusterChat>
);

export const BusterChatProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const value = useBusterChat();

  return <BusterChat.Provider value={value}>{children}</BusterChat.Provider>;
};

export const useBusterChatContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useBusterChat>, T>
) => useContextSelector(BusterChat, selector);

export const useBusterChatIndividual = ({ chatId: chatIdProp }: { chatId?: string }) => {
  const chatId = chatIdProp || '';
  const chat = useBusterChatContextSelector((x) => x.chats[chatId]);
  const subscribeToChat = useBusterChatContextSelector((x) => x.subscribeToChat);
  const unsubscribeFromChat = useBusterChatContextSelector((x) => x.unsubscribeFromChat);

  useEffect(() => {
    if (chatId) subscribeToChat({ chatId });
  }, [chatId]);

  useUnmount(() => {
    if (chatId) unsubscribeFromChat({ chatId });
  });

  return {
    chat
  };
};

export const useBusterChatAssetIndividual = ({
  chatId,
  assetId,
  type
}: {
  chatId: string;
  assetId: string;
  type: FileType;
}) => {};
