import type { ModelMessage } from 'ai';
import { z } from 'zod';

export type MessageHistory = ModelMessage[];

export const MessageHistorySchema = z
  .array(z.custom<ModelMessage>())
  .describe('Array of conversation messages');

export const BusterChatMessageResponseSchema = z.union([
  z.object({
    id: z.string(),
    type: z.literal('text'),
    message: z.string(),
    message_chunk: z.string().optional(),
  }),
  z.object({
    id: z.string(),
    type: z.literal('asset'),
    asset: z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
    }),
  }),
]);

export type BusterChatMessageResponse = z.infer<typeof BusterChatMessageResponseSchema>;
