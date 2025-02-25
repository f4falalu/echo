import { useMemoizedFn } from 'ahooks';
import { useTransition } from 'react';
import type { IBusterChat, IBusterChatMessage } from '../interfaces';
import { useSocketQueryMutation } from '@/api/buster_socket_query';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query_keys';

export const useChatUpdate = () => {
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  const { mutate: updateChat } = useSocketQueryMutation({
    emitEvent: '/chats/update',
    responseEvent: '/chats/update:updateChat'
  });

  const onUpdateChat = useMemoizedFn(
    async (newChatConfig: Partial<IBusterChat> & { id: string }, saveToServer: boolean = false) => {
      const options = queryKeys['chatsGetChat'](newChatConfig.id);
      const queryKey = options.queryKey;
      const currentData = queryClient.getQueryData<IBusterChat>(queryKey);
      const iChat: IBusterChat = {
        ...currentData!,
        ...newChatConfig
      };
      queryClient.setQueryData(queryKey, iChat);
      startTransition(() => {
        //just used to trigger UI update
        if (saveToServer) {
          updateChat({
            id: iChat.id,
            title: iChat.title,
            is_favorited: iChat.is_favorited
          });
        }
      });
    }
  );

  const onUpdateChatMessage = useMemoizedFn(
    async (newMessageConfig: Partial<IBusterChatMessage> & { id: string }) => {
      const options = queryKeys['chatsMessages'](newMessageConfig.id);
      const queryKey = options.queryKey;
      const currentData = queryClient.getQueryData<IBusterChatMessage>(queryKey);
      const iChatMessage: IBusterChatMessage = {
        ...currentData!,
        ...newMessageConfig
      };
      queryClient.setQueryData(queryKey, iChatMessage);
    }
  );

  return {
    onUpdateChat,
    onUpdateChatMessage
  };
};
