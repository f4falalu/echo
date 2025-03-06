import { create } from 'mutative';
import { IBusterChat, IBusterChatMessage } from '../interfaces';
import { ChatEvent_GeneratingTitle } from '@/api/buster_socket/chats';

const createInitialMessage = (messageId: string): IBusterChatMessage => ({
  id: messageId,
  isCompletedStream: false,
  request_message: {
    request: '',
    sender_id: '',
    sender_name: '',
    sender_avatar: null
  },
  response_message_ids: [],
  reasoning_message_ids: [],
  response_messages: {},
  reasoning_messages: {},
  created_at: new Date().toISOString(),
  final_reasoning_message: null
});

export const initializeOrUpdateMessage = (
  messageId: string,
  currentMessage: IBusterChatMessage | undefined,
  updateFn: (draft: IBusterChatMessage) => void
) => {
  return create(currentMessage || createInitialMessage(messageId), (draft) => {
    updateFn(draft);
  });
};

export const updateChatTitle = (
  currentChat: IBusterChat,
  event: ChatEvent_GeneratingTitle
): IBusterChat => {
  const { chat_id, title, title_chunk, progress } = event;
  const isCompleted = progress === 'completed';
  const currentTitle = currentChat.title || '';
  const newTitle = isCompleted ? title : currentTitle + title_chunk;
  return create(currentChat, (draft) => {
    if (newTitle) draft.title = newTitle;
  });
};
