import { z } from 'zod';

// Input schema - simple UUID validation
export const UUIDSchema = z.string().uuid('Must be a valid UUID');

export const TaskInputSchema = z.object({
  messageId: UUIDSchema,
});

// Task execution result for internal monitoring
export const TaskExecutionResultSchema = z.object({
  success: z.boolean(),
  messageId: z.string(),
  executionTimeMs: z.number(),
  workflowCompleted: z.boolean(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.any()).optional(),
    })
    .optional(),
});

// Main output schema - what Trigger.dev expects
export const TaskOutputSchema = z.object({
  success: z.boolean(),
  messageId: z.string(),
  result: TaskExecutionResultSchema.optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.any()).optional(),
    })
    .optional(),
});

// Database output schemas
export const PostProcessingResultSchema = z.object({
  postProcessingMessage: z.record(z.unknown()),
  createdAt: z.date(),
});

// Infer TypeScript types from schemas
export type TaskInput = z.infer<typeof TaskInputSchema>;
export type TaskOutput = z.infer<typeof TaskOutputSchema>;
export type PostProcessingResult = z.infer<typeof PostProcessingResultSchema>;

// Error types
export class MessageNotFoundError extends Error {
  constructor(messageId: string) {
    super(`Message not found: ${messageId}`);
    this.name = 'MessageNotFoundError';
  }
}

export class DataFetchError extends Error {
  constructor(message: string, options?: { cause?: Error }) {
    super(message, options);
    this.name = 'DataFetchError';
  }
}
