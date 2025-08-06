import { z } from 'zod';
import { MessageHistorySchema } from '../utils/memory/types';

// Dashboard file context schema
export const DashboardFileContextSchema = z.object({
  id: z.string(),
  name: z.string(),
  versionNumber: z.number(),
  metricIds: z.array(z.string()),
});

export type DashboardFileContext = z.infer<typeof DashboardFileContextSchema>;

// Input schema for the analyst workflow
export const thinkAndPrepWorkflowInputSchema = z.object({
  prompt: z.string(),
  conversationHistory: MessageHistorySchema.optional(),
  dashboardFiles: z.array(DashboardFileContextSchema).optional(),
});
