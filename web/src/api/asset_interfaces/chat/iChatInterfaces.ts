import { BusterChat } from './chatInterfaces';
import { BusterChatMessage } from './chatMessageInterfaces';

export interface IBusterChat extends Omit<BusterChat, 'messages'> {
  isNewChat: boolean;
}

export interface IBusterChatMessage extends BusterChatMessage {
  isCompletedStream: boolean;
}
