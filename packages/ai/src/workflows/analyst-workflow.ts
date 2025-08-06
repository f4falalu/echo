import { createWorkflow } from '@mastra/core';
import { z } from 'zod';
import {
  type AnalystAgentContext,
  AnalystAgentContextSchema,
} from '../agents/analyst-agent/analyst-agent-context';
import { thinkAndPrepWorkflowInputSchema } from '../schemas/workflow-schemas';

// Re-export for backward compatibility
export { thinkAndPrepWorkflowInputSchema, AnalystAgentContextSchema, type AnalystAgentContext };
// Legacy exports - deprecated, use AnalystAgentContext instead
export {
  AnalystAgentContextSchema as AnalystRuntimeContextSchema,
  type AnalystAgentContext as AnalystRuntimeContext,
};
import { analystStep } from '../steps/analyst-step';
import { createTodosStep } from '../steps/create-todos-step';
import { extractValuesSearchStep } from '../steps/extract-values-search-step';
import { formatOutputStep } from '../steps/format-output-step';
import { generateChatTitleStep } from '../steps/generate-chat-title-step';
import { markMessageCompleteStep } from '../steps/mark-message-complete-step';
import { thinkAndPrepStep } from '../steps/think-and-prep-step';
import {
  MessageHistorySchema,
  ReasoningHistorySchema,
  ResponseHistorySchema,
  StepFinishDataSchema,
} from '../utils/memory/types';

// Metadata schema for output
const WorkflowMetadataSchema = z.object({
  toolsUsed: z.array(z.string()).optional(),
  finalTool: z.string().optional(),
  text: z.string().optional(),
  reasoning: z.string().optional(),
  doneTool: z.boolean().optional(),
  filesCreated: z.number().optional(),
  filesReturned: z.number().optional(),
});

const outputSchema = z.object({
  title: z.string().optional(),
  todos: z.array(z.string()).optional(),
  values: z.array(z.string()).optional(),
  conversationHistory: MessageHistorySchema.optional(),
  finished: z.boolean().optional(),
  stepData: StepFinishDataSchema.optional(),
  reasoningHistory: ReasoningHistorySchema, // Add reasoning history
  responseHistory: ResponseHistorySchema, // Add response history
  metadata: WorkflowMetadataSchema.optional(),
});

const analystWorkflow = createWorkflow({
  id: 'analyst-workflow',
  inputSchema: thinkAndPrepWorkflowInputSchema,
  outputSchema,
  steps: [
    generateChatTitleStep,
    extractValuesSearchStep,
    createTodosStep,
    thinkAndPrepStep,
    analystStep,
    markMessageCompleteStep,
    formatOutputStep,
  ],
})
  .parallel([generateChatTitleStep, extractValuesSearchStep, createTodosStep])
  .then(thinkAndPrepStep)
  .then(analystStep) // Always run analyst step - it will pass through if finished
  .then(markMessageCompleteStep)
  .then(formatOutputStep)
  .commit();

export default analystWorkflow;
