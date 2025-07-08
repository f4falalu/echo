import { z } from 'zod/v4';

export const AssumptionSchema = z.object({
  label: z.enum(['minor', 'vagueRequest']),
});

export const PostProcessingMessageSchema = z.object({
  assumptions: z.array(AssumptionSchema),
});

export type PostProcessingMessage = z.infer<typeof PostProcessingMessageSchema>;
