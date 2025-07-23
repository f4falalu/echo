import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import {
  ClarifyingQuestionSchema,
  type DocsAgentContext,
  DocsAgentContextKey,
  type MessageUserClarifyingQuestion,
} from '../../../context/docs-agent-context';

const updateClarificationsInputSchema = z.object({
  issue: z.string().describe('The issue or problem that needs clarification'),
  context: z
    .string()
    .describe('The context around the issue to help understand what clarification is needed'),
  clarificationQuestion: z
    .string()
    .describe('The specific question to ask the user for clarification'),
});

const updateClarificationsOutputSchema = z.object({
  success: z.boolean(),
  clarification: ClarifyingQuestionSchema.optional(),
  message: z.string().optional(),
});

const updateClarificationsExecution = wrapTraced(
  async (
    params: z.infer<typeof updateClarificationsInputSchema>,
    runtimeContext: RuntimeContext<DocsAgentContext>
  ): Promise<z.infer<typeof updateClarificationsOutputSchema>> => {
    const { issue, context, clarificationQuestion } = params;

    try {
      // Create the new clarification question
      const newClarification: MessageUserClarifyingQuestion = {
        issue,
        context,
        clarificationQuestion,
      };

      // Validate the clarification against the schema
      const validatedClarification = ClarifyingQuestionSchema.parse(newClarification);

      // Update the context with the new clarification
      runtimeContext.set('clarificationQuestion', validatedClarification);

      return {
        success: true,
        clarification: validatedClarification,
        message: 'Successfully added clarification question',
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          message: `Validation error: ${error.errors.map((e) => e.message).join(', ')}`,
        };
      }

      return {
        success: false,
        message: `Error adding clarification: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
  { name: 'update-clarifications-file' }
);

export const updateClarificationsFile = createTool({
  id: 'update-clarifications-file',
  description:
    'Add a new clarification question to the context. This tool helps agents request clarification from users when they encounter ambiguous or unclear requirements.',
  inputSchema: updateClarificationsInputSchema,
  outputSchema: updateClarificationsOutputSchema,
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: z.infer<typeof updateClarificationsInputSchema>;
    runtimeContext: RuntimeContext<DocsAgentContext>;
  }) => {
    return await updateClarificationsExecution(context, runtimeContext);
  },
});

export default updateClarificationsFile;
