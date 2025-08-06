import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import {
  ClarifyingQuestionSchema,
  type DocsAgentContext,
  type MessageUserClarifyingQuestion,
} from '../../../agents/docs-agent/docs-agent-context';

const updateClarificationsInputSchema = z.object({
  clarifications: z
    .array(ClarifyingQuestionSchema)
    .describe('Array of clarification questions to set as the complete clarification file'),
});

const updateClarificationsOutputSchema = z.object({
  success: z.boolean(),
  clarifications: z.array(ClarifyingQuestionSchema).optional(),
  message: z.string().optional(),
  totalClarifications: z.number().optional().describe('Total number of clarification questions'),
});

const updateClarificationsExecution = wrapTraced(
  async (
    params: z.infer<typeof updateClarificationsInputSchema>,
    runtimeContext: RuntimeContext<DocsAgentContext>
  ): Promise<z.infer<typeof updateClarificationsOutputSchema>> => {
    const { clarifications } = params;

    try {
      // Validate all clarifications against the schema
      const validatedClarifications = z.array(ClarifyingQuestionSchema).parse(clarifications);

      // Update the context with the new clarifications array
      runtimeContext.set('clarificationQuestions', validatedClarifications);

      return {
        success: true,
        clarifications: validatedClarifications,
        message: 'Successfully updated clarification questions',
        totalClarifications: validatedClarifications.length,
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
        message: `Error updating clarifications: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
  { name: 'update-clarifications-file' }
);

export const updateClarificationsFile = createTool({
  id: 'update-clarifications-file',
  description:
    'Update the clarification questions file with a new array of clarification questions. This replaces any existing clarification questions with the provided array.',
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
