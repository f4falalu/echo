import { z } from 'zod';

// Pagination parameters for chat list
export const GetChatsListRequestSchema = z.object({
  page_token: z.number().optional().default(0),
  page_size: z.number().optional().default(1000),
});

export type GetChatsListRequest = z.infer<typeof GetChatsListRequestSchema>;

// Request for getting a single chat
export const GetChatRequestSchema = z.object({
  id: z.string(),
});

export type GetChatRequest = z.infer<typeof GetChatRequestSchema>;

// Request for deleting multiple chats
export const DeleteChatsRequestSchema = z.array(z.string());

export type DeleteChatsRequest = z.infer<typeof DeleteChatsRequestSchema>;

// Request for updating a chat
export const UpdateChatRequestSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  is_favorited: z.boolean().optional(),
});

export type UpdateChatRequest = z.infer<typeof UpdateChatRequestSchema>;

// Request for updating chat message feedback
export const UpdateChatMessageFeedbackRequestSchema = z.object({
  message_id: z.string(),
  feedback: z.enum(['negative']).nullable(),
});

export type UpdateChatMessageFeedbackRequest = z.infer<
  typeof UpdateChatMessageFeedbackRequestSchema
>;

// Request for duplicating a chat
export const DuplicateChatRequestSchema = z.object({
  id: z.string(),
  message_id: z.string().optional(),
});

export type DuplicateChatRequest = z.infer<typeof DuplicateChatRequestSchema>;

// Asset type enum for starting chat from asset
const AssetTypeSchema = z.enum(['metric', 'dashboard']);

// Request for starting a chat from an asset
export const StartChatFromAssetRequestSchema = z.object({
  asset_id: z.string(),
  asset_type: AssetTypeSchema,
  prompt: z.string().optional(),
});

export type StartChatFromAssetRequest = z.infer<typeof StartChatFromAssetRequestSchema>;

// Logs list request (same as chats list)
export const GetLogsListRequestSchema = GetChatsListRequestSchema;
export type GetLogsListRequest = z.infer<typeof GetLogsListRequestSchema>;
