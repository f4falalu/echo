import type { BusterChat, BusterChatMessage } from '@/api/asset_interfaces';
import type { IBusterChat, IBusterChatMessage } from '../../interfaces';

export const chatUpgrader = (
  chat: BusterChat,
  options?: { isNewChat?: boolean; isFollowupMessage?: boolean }
): IBusterChat => {
  const { isNewChat = false, isFollowupMessage = false } = options || {};
  return {
    ...chat,
    isNewChat,
    isFollowupMessage,
    messages: chat.messages.map((message) => message.id)
  };
};

export const chatMessageUpgrader = (
  message: BusterChatMessage[],
  options?: { isCompletedStream: boolean; messageId: string }
): Record<string, IBusterChatMessage> => {
  const lastMessageId = message[message.length - 1].id;
  const { isCompletedStream = true, messageId } = options || {};
  const optionMessageId = messageId || lastMessageId;

  return message.reduce(
    (acc, message) => {
      if (message.id === optionMessageId) {
        acc[message.id] = {
          ...message,
          isCompletedStream
        };
      } else {
        acc[message.id] = {
          ...message,
          isCompletedStream: true
        };
      }
      return acc;
    },
    {} as Record<string, IBusterChatMessage>
  );
};
