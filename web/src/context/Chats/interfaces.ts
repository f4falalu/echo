import type { BusterChat, BusterChatMessage } from '@/api/buster_socket/chats';

export interface IBusterChat extends BusterChat {
  isNewChat: boolean;
  isFollowupMessage: boolean;
  messages: IBusterChatMessage[];
}

export interface IBusterChatMessage extends BusterChatMessage {
  isCompletedStream: boolean;
}
