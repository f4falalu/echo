import type { RustApiError } from '../../buster_rest/errors';
import type { BusterChat, BusterChatListItem } from '../../asset_interfaces/chat';
import { ChatEvent_GeneratingMessage, ChatEvent_GeneratingTitle } from './eventInterfaces';

export enum ChatsResponses {
  '/chats/list:getChatsList' = '/chats/list:getChatsList',
  '/chats/unsubscribe:unsubscribe' = '/chats/unsubscribe:unsubscribe',
  '/chats/get:getChat' = '/chats/get:getChat',
  '/chats/get:getChatAsset' = '/chats/get:getChatAsset',
  '/chats/post:initializeChat' = '/chats/post:initializeChat',
  '/chats/post:generatingTitle' = '/chats/post:generatingTitle'
}

export type ChatList_getChatsList = {
  route: '/chats/list:getChatsList';
  callback: (d: BusterChatListItem[]) => void;
  onError?: (d: unknown | RustApiError) => void;
};

/**
 * Response type for getting a single chat's details.
 * This response is triggered when requesting a specific chat's information.
 */
export type Chat_getChat = {
  /** The route identifier for getting a single chat */
  route: '/chats/get:getChat';
  /** Callback function that receives the chat data */
  callback: (chat: BusterChat) => void;
  /** Optional error handler for when the chat request fails */
  onError?: (error: RustApiError) => void;
};

export type Chat_unsubscribe = {
  route: '/chats/unsubscribe:unsubscribe';
  callback: (d: { id: string }[]) => void;
  onError?: (d: unknown | RustApiError) => void;
};

export type Chat_getChatAsset = {
  route: '/chats/get:getChatAsset';
  callback: (d: BusterChat) => void;
  onError?: (d: unknown | RustApiError) => void;
};

/***** CHAT PROGRESS EVENTS START ******/

export type ChatPost_initializeChat = {
  route: '/chats/post:initializeChat';
  callback: (d: BusterChat) => void;
  onError?: (d: unknown | RustApiError) => void;
};

export type ChatPost_generatingTitle = {
  route: '/chats/post:generatingTitle';
  callback: (d: ChatEvent_GeneratingTitle) => void;
  onError?: (d: unknown | RustApiError) => void;
};

export type ChatPost_generatingMessage = {
  route: '/chats/post:generatingMessage';
  callback: (d: ChatEvent_GeneratingMessage) => void;
  onError?: (d: unknown | RustApiError) => void;
};

/***** CHAT PROGRESS EVENTS END ******/

export type ChatResponseTypes =
  | ChatList_getChatsList
  | Chat_unsubscribe
  | Chat_getChat
  | Chat_getChatAsset
  | ChatPost_initializeChat
  | ChatPost_generatingTitle
  | ChatPost_generatingMessage;
