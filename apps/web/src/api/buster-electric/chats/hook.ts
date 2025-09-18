import { useMemo } from 'react';
import { useChatUpdate } from '@/api/buster_rest/chats/useChatUpdate';
import { useShape, useShapeStream } from '../instances';
import { type BusterChatWithoutMessages, chatShape } from './shapes';

export const useGetChat = ({ chatId }: { chatId: string }) => {
  const shape = useMemo(() => chatShape({ chatId }), [chatId]);
  return useShape(shape);
};

const updateOperations: Array<`insert` | `update` | `delete`> = ['update'];

export const useTrackAndUpdateChatChanges = (
  {
    chatId,
  }: {
    chatId: string | undefined;
    isStreamingMessage: boolean;
  },
  callback?: (chat: BusterChatWithoutMessages) => void
) => {
  const { onUpdateChat } = useChatUpdate();
  const shape = useMemo(() => {
    console.log('new shape stream for chat', chatId);
    return chatShape({ chatId: chatId || '' });
  }, [chatId]);
  const subscribe = !!chatId;

  return useShapeStream(
    shape,
    updateOperations,
    (chat) => {
      if (chat?.value) {
        callback?.(chat.value);
        onUpdateChat(chat.value);
      }
    },
    subscribe
  );
};
