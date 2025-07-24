import { z } from 'zod';
import { AssetTypeSchema } from '../assets/asset-types.types';
import { ShareIndividualSchema } from '../share';
import { ChatMessageSchema } from './chat-message.types';

// Asset Permission Role enum (matching database enum)
export const AssetPermissionRoleSchema = z.enum(['viewer', 'editor', 'owner']);
export const ChatAssetTypeSchema = AssetTypeSchema.exclude(['chat', 'collection']);

// Main ChatWithMessages schema
export const ChatWithMessagesSchema = z.object({
  id: z.string(),
  title: z.string(),
  is_favorited: z.boolean(),
  message_ids: z.array(z.string()),
  messages: z.record(z.string(), ChatMessageSchema),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string(),
  created_by_id: z.string(),
  created_by_name: z.string(),
  created_by_avatar: z.string().nullable(),
  // Sharing fields
  individual_permissions: z.array(ShareIndividualSchema).optional(),
  publicly_accessible: z.boolean(),
  public_expiry_date: z.string().datetime().optional(),
  public_enabled_by: z.string().optional(),
  public_password: z.string().optional(),
  permission: AssetPermissionRoleSchema.optional(),
});

export const ChatCreateRequestSchema = z
  .object({
    prompt: z.string().optional(),
    chat_id: z.string().optional(),
    message_id: z.string().optional(),
    asset_id: z.string().optional(),
    asset_type: ChatAssetTypeSchema.optional(),
    // Legacy fields for backward compatibility
    metric_id: z.string().optional(),
    dashboard_id: z.string().optional(),
  })
  .refine((data) => !data.asset_id || data.asset_type, {
    message: 'asset_type must be provided when asset_id is specified',
    path: ['asset_type'],
  });

// Handler request schema (internal - without legacy fields)
export const ChatCreateHandlerRequestSchema = z.object({
  prompt: z.string().optional(),
  chat_id: z.string().optional(),
  message_id: z.string().optional(),
  asset_id: z.string().optional(),
  asset_type: ChatAssetTypeSchema.optional(),
});

// Cancel chat params schema
export const CancelChatParamsSchema = z.object({
  chat_id: z.string().uuid(),
});

// Infer types from schemas
export type AssetPermissionRole = z.infer<typeof AssetPermissionRoleSchema>;
export type ChatWithMessages = z.infer<typeof ChatWithMessagesSchema>;
export type ChatCreateRequest = z.infer<typeof ChatCreateRequestSchema>;
export type ChatCreateHandlerRequest = z.infer<typeof ChatCreateHandlerRequestSchema>;
export type CancelChatParams = z.infer<typeof CancelChatParamsSchema>;
export type ChatAssetType = z.infer<typeof ChatAssetTypeSchema>;
