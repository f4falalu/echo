import type { BusterChat, BusterChatMessage } from '@/api/asset_interfaces';

export interface IBusterChat extends BusterChat {
  isNewChat: boolean;
}

export interface IBusterChatMessage extends BusterChatMessage {
  isCompletedStream: boolean;
}
