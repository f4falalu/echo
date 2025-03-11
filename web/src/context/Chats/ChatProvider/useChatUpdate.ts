import { useMemoizedFn } from '@/hooks';
import type { IBusterChat, IBusterChatMessage } from '@/api/asset_interfaces/chat';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query_keys';
import { create } from 'mutative';
import { useUpdateChat } from '@/api/buster_rest/chats';

export const useChatUpdate = () => {
  const queryClient = useQueryClient();

  const { mutate: updateChat } = useUpdateChat();

  const onUpdateChat = useMemoizedFn(
    async (newChatConfig: Partial<IBusterChat> & { id: string }, saveToServer: boolean = false) => {
      const options = queryKeys.chatsGetChat(newChatConfig.id);
      const queryKey = options.queryKey;
      const currentData = queryClient.getQueryData<IBusterChat>(queryKey);

      const iChat = create(currentData || ({} as IBusterChat), (draft) => {
        Object.assign(draft, newChatConfig);
      });
      queryClient.setQueryData(queryKey, iChat);

      //just used to trigger UI update
      //TODO: reevaluate if this is needed and if we should should
      if (saveToServer) {
        updateChat({
          id: iChat.id,
          title: iChat.title,
          is_favorited: iChat.is_favorited
        });
      }
    }
  );

  const onUpdateChatMessage = useMemoizedFn(
    async (newMessageConfig: Partial<IBusterChatMessage> & { id: string }) => {
      const options = queryKeys.chatsMessages(newMessageConfig.id);
      const queryKey = options.queryKey;
      const currentData = queryClient.getQueryData(queryKey);

      const iChatMessage = create(currentData!, (draft) => {
        Object.assign(draft, newMessageConfig);
      });

      queryClient.setQueryData(queryKey, iChatMessage);
    }
  );

  return {
    onUpdateChat,
    onUpdateChatMessage
  };
};
