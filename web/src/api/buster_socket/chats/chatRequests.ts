import type { BusterSocketRequestBase } from '../baseInterfaces';
import type { FileType } from './config';

export type ChatCreateNewChat = BusterSocketRequestBase<
  '/chats/post',
  {
    dataset_id: string | null;
    prompt?: string; //send if we are starting a new chat
    chat_id?: string | null; //send if we are following up on a chat
    suggestion_id?: string | null; //send if we clicked on a suggestion
    message_id?: string; //send if we want to REPLACE current message
    draft_session_id?: string; //TODO: do we need this?
  }
>;

export type ChatGetChat = BusterSocketRequestBase<'/chats/get', { id: string }>;

export type ChatUnsubscribeFromChat = BusterSocketRequestBase<'/chats/unsubscribe', { id: string }>;

export type ChatGetChatAsset = BusterSocketRequestBase<
  '/chats/get/asset',
  { id: string; type: FileType; version_id?: string }
>;

export type ChatListEmitPayload = BusterSocketRequestBase<
  '/chats/list',
  {
    page_token: number;
    page_size: number;
    admin_view: boolean;
    filters?: {};
  }
>;

export type ChatDeleteChat = BusterSocketRequestBase<'/chats/delete', { id: string }>;

export type ChatUpdateChat = BusterSocketRequestBase<
  '/chats/update',
  { id: string; title?: string; is_favorited?: boolean }
>;

export type ChatsSearch = BusterSocketRequestBase<'/chats/search', { prompt: string }>;

export type ChatsDuplicateChat = BusterSocketRequestBase<
  '/chats/duplicate',
  {
    id: string;
    message_id?: string; //send if we want to duplciate the chat starting from a specific message
  }
>;

export type ChatEmits =
  | ChatCreateNewChat
  | ChatGetChat
  | ChatUnsubscribeFromChat
  | ChatGetChatAsset
  | ChatListEmitPayload
  | ChatDeleteChat
  | ChatUpdateChat
  | ChatsSearch
  | ChatsDuplicateChat;
