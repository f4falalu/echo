import type { BusterChat, BusterChatMessage } from '@/api/asset_interfaces';
import type { IBusterChat, IBusterChatMessage } from '@/context/Chats/interfaces';

const chatUpgrader = (chat: BusterChat, { isNewChat }: { isNewChat: boolean }): IBusterChat => {
  return {
    ...chat,
    messages: chat.messages.map((message) => message.id),
    isNewChat
  };
};

const chatMessageUpgrader = (
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

export const updateChatToIChat = (chat: BusterChat, isNewChat: boolean) => {
  const iChat = chatUpgrader(chat, { isNewChat });
  const iChatMessages = chatMessageUpgrader(chat.messages, {
    isCompletedStream: !isNewChat,
    messageId: chat.messages[0].id
  });
  return {
    iChat,
    iChatMessages
  };
};
