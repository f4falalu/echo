import type { BusterChat, BusterChatMessage } from '@/api/asset_interfaces/chat';

export interface IBusterChat extends BusterChat {
  isNewChat: boolean;
  isFollowupMessage: boolean;
  messages: IBusterChatMessage[];
}

export interface IBusterChatMessage extends BusterChatMessage {
  isCompletedStream: boolean;
}
