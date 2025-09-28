import { z } from 'zod';
import { AssetTypeSchema, BaseAssetTypeSchema } from '../assets/asset-types.types';
import { PostProcessingMessageSchema } from '../message';

// Re-create the schemas locally to avoid ESM/CommonJS issues
// These match the schemas defined in @buster/database/src/schemas/message-schemas.ts

// Status schema for messages
const StatusSchema = z.enum(['loading', 'completed', 'failed']);

// Response message schemas
const ResponseMessage_TextSchema = z.object({
  id: z.string(),
  type: z.literal('text'),
  message: z.string(),
  is_final_message: z.boolean().optional(),
});

const ResponseMessage_FileMetadataSchema = z.object({
  status: StatusSchema,
  message: z.string(),
  timestamp: z.number().optional(),
});

const ResponseMessageFileTypeSchema = z.enum([
  'metric_file',
  'dashboard_file',
  'reasoning',
  'report_file',
]);

const ResponseMessage_FileSchema = z.object({
  id: z.string(),
  type: z.literal('file'),
  file_type: ResponseMessageFileTypeSchema,
  file_name: z.string(),
  version_number: z.number(),
  filter_version_id: z.string().nullable().optional(),
  metadata: z.array(ResponseMessage_FileMetadataSchema).optional(),
});

const ResponseMessageSchema = z.discriminatedUnion('type', [
  ResponseMessage_TextSchema,
  ResponseMessage_FileSchema,
]);

// Reasoning message schemas
const ReasoningMessage_TextSchema = z.object({
  id: z.string(),
  type: z.literal('text'),
  title: z.string(),
  secondary_title: z.string().optional(),
  message: z.string().optional().nullable(),
  message_chunk: z.string().optional().nullable(),
  status: StatusSchema,
});

const ReasoningFileTypeSchema = z.enum([
  ...BaseAssetTypeSchema.options,
  'reasoning',
  'agent-action',
  'todo',
]);

const ReasoningFileSchema = z.object({
  id: z.string(),
  file_type: ReasoningFileTypeSchema,
  file_name: z.string(),
  version_number: z.number().optional(),
  status: StatusSchema,
  file: z.object({
    text: z.string().optional(),
    modified: z.array(z.tuple([z.number(), z.number()])).optional(),
  }),
});

const ReasoningMessage_FilesSchema = z.object({
  id: z.string(),
  type: z.literal('files'),
  title: z.string(),
  status: StatusSchema,
  secondary_title: z.string().optional(),
  file_ids: z.array(z.string()),
  files: z.record(z.string(), ReasoningFileSchema),
});

const ReasoningMessage_ThoughtFileTypeSchema = z.enum([
  ...AssetTypeSchema.exclude(['chat']).options,
  'dataset',
  'term',
  'topic',
  'value',
  'empty',
]);

const ReasoningMessage_PillSchema = z.object({
  text: z.string(),
  type: ReasoningMessage_ThoughtFileTypeSchema,
  id: z.string(),
});

const ReasoningMessage_PillContainerSchema = z.object({
  title: z.string(),
  pills: z.array(ReasoningMessage_PillSchema),
});

const ReasoningMessage_PillsSchema = z.object({
  id: z.string(),
  type: z.literal('pills'),
  title: z.string(),
  secondary_title: z.string().optional(),
  pill_containers: z.array(ReasoningMessage_PillContainerSchema),
  status: StatusSchema,
});

const ReasoningMessageSchema = z
  .discriminatedUnion('type', [
    ReasoningMessage_TextSchema,
    ReasoningMessage_FilesSchema,
    ReasoningMessage_PillsSchema,
  ])
  .and(
    z.object({
      finished_reasoning: z.boolean().optional(),
    })
  );

// Message role for chat messages
const MessageRoleSchema = z.enum(['user', 'assistant']);

// Chat user message schema
const ChatUserMessageSchema = z
  .object({
    request: z.string().nullable(),
    sender_id: z.string(),
    sender_name: z.string(),
    sender_avatar: z.string().nullable().optional(),
  })
  .or(z.null());

// Chat message schema
export const ChatMessageSchema = z.object({
  id: z.string(),
  request_message: ChatUserMessageSchema,
  response_messages: z.record(z.string(), ResponseMessageSchema),
  response_message_ids: z.array(z.string()),
  reasoning_message_ids: z.array(z.string()),
  reasoning_messages: z.record(z.string(), ReasoningMessageSchema),
  created_at: z.string(),
  updated_at: z.string(),
  final_reasoning_message: z.string().nullable(),
  feedback: z.enum(['negative']).nullable(),
  is_completed: z.boolean(),
  post_processing_message: PostProcessingMessageSchema.optional(),
});

export type MessageRole = z.infer<typeof MessageRoleSchema>;
export type ChatUserMessage = z.infer<typeof ChatUserMessageSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ResponseMessageFileType = z.infer<typeof ResponseMessageFileTypeSchema>;
