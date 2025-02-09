import type { BusterChat, BusterChatMessage } from '@/api/asset_interfaces';

export interface IBusterChat extends Omit<BusterChat, 'messages'> {
  isNewChat: boolean;
  isFollowupMessage: boolean;
  messages: string[];
}

export interface IBusterChatMessage extends BusterChatMessage {
  isCompletedStream: boolean;
}
