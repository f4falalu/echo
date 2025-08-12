import { generateObject } from 'ai';
import type { ModelMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { Sonnet4 } from '../../../llm/sonnet-4';
import { getCreateTodosSystemMessage } from './get-create-todos-system-message';

// Zod schemas first - following Zod-first approach
export const createTodosParamsSchema = z.object({
  messages: z.array(z.custom<ModelMessage>()).describe('The conversation history'),
});

export const createTodosResultSchema = z.object({
  todos: z.string().describe('The TODO list in markdown format with checkboxes'),
  todosMessage: z.custom<ModelMessage>().describe('The TODO list message'),
});

// Export types from schemas
export type CreateTodosParams = z.infer<typeof createTodosParamsSchema>;
export type CreateTodosResult = z.infer<typeof createTodosResultSchema>;

// Schema for what the LLM returns
const llmOutputSchema = z.object({
  todos: z
    .string()
    .describe(
      'The TODO list in markdown format with checkboxes. Example: "[ ] Todo 1\n[ ] Todo 2\n[ ] Todo 3"'
    ),
});

/**
 * Generates a TODO list using the LLM with structured output
 */
async function generateTodosWithLLM(messages: ModelMessage[]): Promise<string> {
  try {
    // Prepare messages for the LLM
    const systemMessage: ModelMessage = {
      role: 'system',
      content: getCreateTodosSystemMessage(),
    };

    const todosMessages: ModelMessage[] = [systemMessage, ...messages];

    const tracedTodosGeneration = wrapTraced(
      async () => {
        const { object } = await generateObject({
          model: Sonnet4,
          schema: llmOutputSchema,
          messages: todosMessages,
          temperature: 0,
        });

        return object;
      },
      {
        name: 'Generate Todos',
      }
    );

    const result = await tracedTodosGeneration();
    return result.todos ?? '';
  } catch (llmError) {
    console.warn('[CreateTodos] LLM failed to generate valid response:', {
      error: llmError instanceof Error ? llmError.message : 'Unknown error',
      errorType: llmError instanceof Error ? llmError.name : 'Unknown',
    });

    return '';
  }
}

export async function runCreateTodosStep(params: CreateTodosParams): Promise<CreateTodosResult> {
  try {
    const todos = await generateTodosWithLLM(params.messages);

    const todosMessage: ModelMessage = {
      role: 'user',
      content: todos,
    };

    return {
      todos,
      todosMessage,
    };
  } catch (error) {
    console.error('[create-todos-step] Unexpected error:', error);
    throw new Error(
      'Unable to create the analysis plan. Please try again or rephrase your request.'
    );
  }
}
