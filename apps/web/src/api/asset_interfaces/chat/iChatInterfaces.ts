import type { BusterChat } from './chatInterfaces';

export type IBusterChat = Omit<BusterChat, 'messages'>;
