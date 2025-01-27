import React, { useCallback, useRef, useState, useTransition } from 'react';
import {
  createContext,
  ContextSelector,
  useContextSelector
} from '@fluentui/react-context-selector';
import { useBusterWebSocket } from '../BusterWebSocket';
import type { BusterChatAsset, IBusterChat } from '@/api/buster_socket/chats';
import { useMemoizedFn, useMount, useUnmount } from 'ahooks';
import type { FileType } from '@/api/buster_socket/chats';

export const useBusterChat = () => {
  const busterSocket = useBusterWebSocket();
  const [isPending, startTransition] = useTransition();
  const chatsRef = useRef<Record<string, IBusterChat>>({});
  const [seletedAssetId, setSeletedAssetId] = useState<Record<string, string | null>>({});

  // GETTERS

  const getSelectedAssetId = useCallback(
    (chatId: string) => {
      return seletedAssetId[chatId] || null;
    },
    [seletedAssetId]
  );

  // SETTERS

  const onSetSelectedAssetId = useMemoizedFn((chatId: string, assetId: string | null) => {
    setSeletedAssetId((prev) => ({ ...prev, [chatId]: assetId }));
  });

  // LISTENERS

  const _onGetChat = useMemoizedFn((chat: IBusterChat) => {
    chatsRef.current[chat.id] = chat;
    startTransition(() => {
      //just used to trigger UI update
    });
    return chat;
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
    return busterSocket.emitAndOnce({
      emitEvent: {
        route: '/chats/get',
        payload: {
          id: chatId
        }
      },
      responseEvent: {
        route: '/chats/get:getChat',
        callback: _onGetChat
      }
    });
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

  return {
    getSelectedAssetId,
    chats: chatsRef.current,
    unsubscribeFromChat,
    subscribeToChat,
    getChatAsset,
    onSetSelectedAssetId
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

export const useBusterChatIndividual = ({ chatId }: { chatId: string }) => {
  const chat = useBusterChatContextSelector((x) => x.chats[chatId]);
  const subscribeToChat = useBusterChatContextSelector((x) => x.subscribeToChat);
  const unsubscribeFromChat = useBusterChatContextSelector((x) => x.unsubscribeFromChat);
  const selectedAssetId = useBusterChatContextSelector((x) => x.getSelectedAssetId(chatId));
  const onSetSelectedAssetId = useBusterChatContextSelector((x) => x.onSetSelectedAssetId);

  useMount(() => {
    subscribeToChat({ chatId });
  });

  useUnmount(() => {
    unsubscribeFromChat({ chatId });
  });

  return {
    chat,
    selectedAssetId,
    onSetSelectedAssetId
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
