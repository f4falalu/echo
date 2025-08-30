import { z } from 'zod';

// Status schema for messages
export const StatusSchema = z.enum(['loading', 'completed', 'failed']);

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

const ResponseMessageFileTypeSchema = z.enum(['metric', 'dashboard', 'report', 'reasoning']);

const ResponseMessage_FileSchema = z.object({
  id: z.string(),
  type: z.literal('file'),
  file_type: ResponseMessageFileTypeSchema,
  file_name: z.string(),
  version_number: z.number(),
  filter_version_id: z.string().nullable().optional(),
  metadata: z.array(ResponseMessage_FileMetadataSchema).optional(),
});

export const ResponseMessageSchema = z.discriminatedUnion('type', [
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
  'metric',
  'dashboard',
  'report',
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

const ReasoingMessage_ThoughtFileTypeSchema = z.enum([
  'metric',
  'dashboard',
  'collection',
  'dataset',
  'term',
  'topic',
  'value',
  'empty',
]);

const ReasoningMessage_PillSchema = z.object({
  text: z.string(),
  type: ReasoingMessage_ThoughtFileTypeSchema,
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

export const ReasoningMessageSchema = z
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

// Export types
export type ChatMessageReasoning_status = z.infer<typeof StatusSchema>;
export type ChatMessageResponseMessage = z.infer<typeof ResponseMessageSchema>;
export type ChatMessageReasoningMessage = z.infer<typeof ReasoningMessageSchema>;
export type ChatMessageReasoningMessage_Text = z.infer<typeof ReasoningMessage_TextSchema>;
export type ChatMessageReasoningMessage_Files = z.infer<typeof ReasoningMessage_FilesSchema>;
export type ChatMessageReasoningMessage_Pills = z.infer<typeof ReasoningMessage_PillsSchema>;
export type ChatMessageReasoningMessage_File = z.infer<typeof ReasoningFileSchema>;
export type ChatMessageReasoningMessage_Pill = z.infer<typeof ReasoningMessage_PillSchema>;
export type ChatMessageReasoningMessage_PillContainer = z.infer<
  typeof ReasoningMessage_PillContainerSchema
>;
export type ChatMessageResponseMessage_FileMetadata = z.infer<
  typeof ResponseMessage_FileMetadataSchema
>;
export type ChatMessageResponseMessage_Text = z.infer<typeof ResponseMessage_TextSchema>;
export type ChatMessageResponseMessage_File = z.infer<typeof ResponseMessage_FileSchema>;
export type ReasoningFileType = z.infer<typeof ReasoningFileTypeSchema>;
export type ResponseMessageFileType = z.infer<typeof ResponseMessageFileTypeSchema>;
export type ReasoingMessage_ThoughtFileType = z.infer<typeof ReasoingMessage_ThoughtFileTypeSchema>;
