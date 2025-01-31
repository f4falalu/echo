import type { BusterChat, BusterChatMessage } from '@/api/asset_interfaces';
import type { IBusterChat, IBusterChatMessage } from '../interfaces';

export const chatUpgrader = (
  chat: BusterChat,
  options?: { isNewChat?: boolean; isFollowupMessage?: boolean }
): IBusterChat => {
  const { isNewChat = false, isFollowupMessage = false } = options || {};
  return {
    ...chat,
    isNewChat,
    isFollowupMessage,
    messages: chat.messages.map((message) =>
      chatMessageUpgrader(message, { isCompletedStream: !isFollowupMessage && !isNewChat })
    )
  };
};

export const chatMessageUpgrader = (
  message: BusterChatMessage,
  options?: { isCompletedStream?: boolean }
): IBusterChatMessage => {
  const { isCompletedStream = true } = options || {};

  return {
    ...message,
    isCompletedStream
  };
};
