import type { BusterChat, BusterChatMessage } from '@/api/asset_interfaces';

export interface IBusterChat extends Omit<BusterChat, 'messages'> {
  messages: string[];
}

export interface IBusterChatMessage extends BusterChatMessage {
  isCompletedStream: boolean;
}
