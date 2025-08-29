import type { IBusterChat } from '@/api/asset_interfaces';
import { useGetChat } from '@/api/buster_rest/chats';
import { useGetChatId } from './useGetChatId';

const stableChatSelector = (state: IBusterChat) => ({
  title: state.title,
  id: state.id,
  message_ids: state.message_ids,
});

export const useGetActiveChat = () => {
  const chatId = useGetChatId();
  const { data: chat } = useGetChat({ id: chatId || '' }, { select: stableChatSelector });
  return chat;
};

export const useGetCurrentMessageId = () => {
  const chatId = useGetChatId();

  const { data: currentMessageId } = useGetChat(
    { id: chatId || '' },
    {
      select: (data) => data?.message_ids[data?.message_ids.length - 1],
    }
  );

  return currentMessageId;
};
