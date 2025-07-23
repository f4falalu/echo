import { z } from 'zod';
import { ChatListItemSchema } from './chat-list.types';
import { ChatWithMessagesSchema } from './chat.types';

// Response for getting a single chat
export const GetChatResponseSchema = ChatWithMessagesSchema;
export type GetChatResponse = z.infer<typeof GetChatResponseSchema>;

// Response for getting a list of chats
export const GetChatsListResponseSchema = z.array(ChatListItemSchema);
export type GetChatsListResponse = z.infer<typeof GetChatsListResponseSchema>;

// Response for getting logs list (same as chats list)
export const GetLogsListResponseSchema = GetChatsListResponseSchema;
export type GetLogsListResponse = z.infer<typeof GetLogsListResponseSchema>;

// Response for updating a chat
export const UpdateChatResponseSchema = ChatWithMessagesSchema;
export type UpdateChatResponse = z.infer<typeof UpdateChatResponseSchema>;

// Response for updating chat message feedback
export const UpdateChatMessageFeedbackResponseSchema = ChatWithMessagesSchema;
export type UpdateChatMessageFeedbackResponse = z.infer<
  typeof UpdateChatMessageFeedbackResponseSchema
>;

// Response for duplicating a chat
export const DuplicateChatResponseSchema = ChatWithMessagesSchema;
export type DuplicateChatResponse = z.infer<typeof DuplicateChatResponseSchema>;

// Response for deleting chats (void)
export const DeleteChatsResponseSchema = z.void();
export type DeleteChatsResponse = z.infer<typeof DeleteChatsResponseSchema>;
