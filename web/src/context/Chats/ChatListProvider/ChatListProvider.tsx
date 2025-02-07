import React, { PropsWithChildren, useEffect, useRef, useState } from 'react';
import {
  createContext,
  ContextSelector,
  useContextSelector
} from '@fluentui/react-context-selector';
import { useBusterWebSocket } from '../../BusterWebSocket';
import { BusterChatListItem } from '@/api/asset_interfaces';
import { useMemoizedFn, useThrottleFn } from 'ahooks';
import { chatsArrayToRecord, createFilterRecord } from './helpers';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { BusterRoutes } from '@/routes';

interface IChatList {
  fetching: boolean;
  fetched: boolean;
  fetchedAt: number;
  chatListIds: string[];
}

export const useBusterChatList = () => {
  const busterSocket = useBusterWebSocket();

  const [chatList, setChatList] = useState<Record<string, BusterChatListItem>>({});
  const [chatListIds, setChatListIds] = useState<Record<string, IChatList>>({});

  //STATE UPDATES

  const onUpdateChatListItem = useMemoizedFn(
    (newChat: Partial<BusterChatListItem> & { id: string }) => {
      setChatList((prevChats) => {
        return {
          ...prevChats,
          [newChat.id]: {
            ...prevChats[newChat.id],
            ...newChat
          }
        };
      });
    }
  );

  const removeItemFromChatList = useMemoizedFn(({ chatId }: { chatId: string }) => {
    setChatListIds((prevChatListIds) => {
      const newChatListIds = { ...prevChatListIds };
      Object.keys(newChatListIds).forEach((key) => {
        newChatListIds[key] = {
          ...newChatListIds[key],
          chatListIds: newChatListIds[key].chatListIds.filter((id) => id !== chatId)
        };
      });
      return newChatListIds;
    });
  });

  //LISTENERS

  const _onInitializeListChats = useMemoizedFn(
    (chats: BusterChatListItem[], admin_view: boolean) => {
      const newChats = chatsArrayToRecord(chats);
      const filterKey = createFilterRecord({ admin_view });

      setChatList((prev) => ({
        ...prev,
        ...newChats
      }));

      setChatListIds((prev) => ({
        ...prev,
        [filterKey]: {
          fetching: false,
          fetched: true,
          fetchedAt: Date.now(),
          chatListIds: Object.keys(newChats)
        }
      }));
    }
  );

  const _getChatsList = useMemoizedFn(({ admin_view }: { admin_view: boolean }) => {
    const recordKey = createFilterRecord({ admin_view });

    if (chatListIds[recordKey]?.fetching) {
      return;
    }

    setChatListIds((prev) => {
      const foundRecord = prev[recordKey];
      return {
        ...prev,
        [recordKey]: {
          fetching: true,
          chatListIds: foundRecord?.chatListIds || [],
          fetched: foundRecord?.fetched || false,
          fetchedAt: foundRecord?.fetchedAt || 0
        }
      };
    });

    return busterSocket.emitAndOnce({
      emitEvent: {
        route: '/chats/list',
        payload: {
          page_token: 0,
          page_size: 3000, //TODO: make a pagination
          admin_view
        }
      },
      responseEvent: {
        route: '/chats/list:getChatsList',
        callback: (v) => _onInitializeListChats(v, admin_view)
      }
    });
  });

  //ACTIONS

  const { run: getChatsList } = useThrottleFn(_getChatsList, { wait: 350, leading: true });

  return {
    getChatsList,
    chatList,
    chatListIds,
    onUpdateChatListItem,
    removeItemFromChatList
  };
};

const BusterChatList = createContext<ReturnType<typeof useBusterChatList>>(
  {} as ReturnType<typeof useBusterChatList>
);

export const BusterChatListProvider: React.FC<PropsWithChildren> = React.memo(({ children }) => {
  const chatListContext = useBusterChatList();

  return <BusterChatList.Provider value={chatListContext}>{children}</BusterChatList.Provider>;
});
BusterChatListProvider.displayName = 'BusterChatListProvider';

export const useBusterChatListContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useBusterChatList>, T>
) => {
  return useContextSelector(BusterChatList, selector);
};
