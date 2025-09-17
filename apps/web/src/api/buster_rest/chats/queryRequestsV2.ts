import type { ChatCreateRequest } from '@buster/server-shared/chats';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { BusterChatMessage } from '@/api/asset_interfaces/chat';
import { chatQueryKeys } from '@/api/query_keys/chat';
import { updateChatToIChat } from '@/lib/chat';
import { createNewChat, startChatFromAsset, stopChat } from './requestsV2';
import { useChatUpdate } from './useChatUpdate';

export const useStartNewChat = () => {
  const queryClient = useQueryClient();
  const { onUpdateChat } = useChatUpdate();

  const saveAllChatMessages = (iChatMessages: Record<string, BusterChatMessage>) => {
    for (const message of Object.values(iChatMessages)) {
      const options = chatQueryKeys.chatsMessages(message.id);
      const queryKey = options.queryKey;
      queryClient.setQueryData(queryKey, message);
    }
  };

  return useMutation({
    mutationFn: async (props: ChatCreateRequest) => {
      // I opted to not use honoInstance to take better advantage of turbo caching
      //  const res = await honoInstance.api.v2.chats.$post({ json: props });
      return await createNewChat(props);
    },
    onSuccess: (data) => {
      const { iChat, iChatMessages } = updateChatToIChat(data);
      saveAllChatMessages(iChatMessages);
      onUpdateChat(iChat);
    },
  });
};

export const useStopChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => stopChat({ chatId }),
    onSuccess: (_data, chatId) => {
      const currentChat = queryClient.getQueryData(chatQueryKeys.chatsGetChat(chatId).queryKey);
      if (currentChat) {
        currentChat.message_ids.forEach((messageId) => {
          queryClient.setQueryData(chatQueryKeys.chatsMessages(messageId).queryKey, (v) => {
            if (v) {
              return { ...v, is_completed: true };
            }
          });
        });
      }

      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.chatsGetList().queryKey,
        refetchType: 'all',
      });
    },
  });
};

export const useStartChatFromAssetBase = () => {
  const queryClient = useQueryClient();

  const mutationFn = async (params: Parameters<typeof startChatFromAsset>[0]) => {
    const chat = await startChatFromAsset(params);
    const { iChat, iChatMessages } = updateChatToIChat(chat);
    for (const messageId of iChat.message_ids) {
      queryClient.setQueryData(
        chatQueryKeys.chatsMessages(messageId).queryKey,
        iChatMessages[messageId]
      );
    }
    queryClient.setQueryData(chatQueryKeys.chatsGetChat(chat.id).queryKey, iChat);
    return iChat;
  };

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: chatQueryKeys.chatsGetList().queryKey,
        refetchType: 'all',
      });
    },
  });
};
