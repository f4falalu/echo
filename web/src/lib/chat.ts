import type { BusterChat, BusterChatMessage } from '@/api/asset_interfaces';
import type { IBusterChat, IBusterChatMessage } from '@/context/Chats/interfaces';
import { create } from 'mutative';

const chatUpgrader = (chat: BusterChat, { isNewChat }: { isNewChat: boolean }): IBusterChat => {
  return {
    ...chat,
    isNewChat
  };
};

const chatMessageUpgrader = (
  messageIds: string[],
  message: Record<string, BusterChatMessage>,
  streamingMessageId?: string
): Record<string, IBusterChatMessage> => {
  return messageIds.reduce(
    (acc, messageId) => {
      acc[messageId] = create(message[messageId] as IBusterChatMessage, (draft) => {
        draft.isCompletedStream = streamingMessageId === messageId;
      });
      return acc;
    },
    {} as Record<string, IBusterChatMessage>
  );
};

export const updateChatToIChat = (
  chat: BusterChat,
  isNewChat: boolean
): { iChat: IBusterChat; iChatMessages: Record<string, IBusterChatMessage> } => {
  const iChat = chatUpgrader(chat, { isNewChat });
  const iChatMessages = chatMessageUpgrader(
    chat.message_ids,
    chat.messages,
    isNewChat ? chat.message_ids[0] : undefined
  );
  return {
    iChat,
    iChatMessages
  };
};
