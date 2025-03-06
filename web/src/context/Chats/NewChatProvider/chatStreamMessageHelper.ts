import { create } from 'mutative';
import { IBusterChat, IBusterChatMessage } from '../interfaces';
import {
  ChatEvent_GeneratingTitle,
  ChatEvent_GeneratingResponseMessage
} from '@/api/buster_socket/chats';
import { BusterChatResponseMessage_text } from '@/api/asset_interfaces';

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

export const updateResponseMessage = (
  messageId: string,
  currentMessage: IBusterChatMessage | undefined,
  event: ChatEvent_GeneratingResponseMessage
): IBusterChatMessage => {
  const { response_message } = event;

  if (!response_message?.id) {
    return currentMessage || createInitialMessage(messageId);
  }

  const responseMessageId = response_message.id;
  const existingResponseMessage = currentMessage?.response_messages?.[responseMessageId];
  const isNewResponseMessage = !existingResponseMessage;

  let updatedMessage = currentMessage || createInitialMessage(messageId);

  if (isNewResponseMessage) {
    updatedMessage = initializeOrUpdateMessage(messageId, updatedMessage, (draft) => {
      if (!draft.response_messages) {
        draft.response_messages = {};
      }
      draft.response_messages[responseMessageId] = response_message;
      if (!draft.response_message_ids) {
        draft.response_message_ids = [];
      }
      draft.response_message_ids.push(responseMessageId);
    });
  }

  if (response_message.type === 'text') {
    const existingResponseMessageText = existingResponseMessage as BusterChatResponseMessage_text;
    const isStreaming =
      response_message.message_chunk !== undefined && response_message.message_chunk !== null;

    updatedMessage = initializeOrUpdateMessage(messageId, updatedMessage, (draft) => {
      const responseMessage = draft.response_messages?.[responseMessageId];
      if (!responseMessage) return;
      const messageText = responseMessage as BusterChatResponseMessage_text;
      Object.assign(messageText, {
        ...existingResponseMessageText,
        ...response_message,
        message: isStreaming
          ? (existingResponseMessageText?.message || '') + (response_message.message_chunk || '')
          : response_message.message
      });
    });
  }

  return updatedMessage;
};
