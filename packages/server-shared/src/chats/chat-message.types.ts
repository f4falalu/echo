import { z } from 'zod';
import { PostProcessingMessageSchema } from '../message';
const { ReasoningMessageSchema, ResponseMessageSchema } = require('@buster/database');

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
