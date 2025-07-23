import type { Sandbox } from '@buster/sandbox';
import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { z } from 'zod';
import { ClarifyingQuestionSchema, DocsAgentContextKey } from '../../context/docs-agent-context';

// Input schema includes the context values we need to set
const initializeContextStepInputSchema = z.object({
  message: z.string(),
  organizationId: z.string(),
  // Context values that will be set in runtime context
  sandbox: z.custom<Sandbox>(
    (val) => {
      // Validate it's a sandbox instance with required methods
      return (
        val &&
        typeof val === 'object' &&
        typeof val.execute === 'function' &&
        typeof val.cleanup === 'function'
      );
    },
    {
      message: 'Invalid Sandbox instance',
    }
  ),
  todoList: z.string().optional().default(''),
  clarificationQuestion: ClarifyingQuestionSchema.optional(),
});

// Output schema passes through all input data plus confirms context is initialized
const initializeContextStepOutputSchema = z.object({
  message: z.string(),
  organizationId: z.string(),
  contextInitialized: z.boolean(),
  // Pass through for subsequent steps (but they'll use runtime context)
  context: z.object({
    sandbox: z.any(), // Will be in runtime context
    todoList: z.string(),
    clarificationQuestion: z
      .object({
        issue: z.string(),
        context: z.string(),
        clarificationQuestion: z.string(),
      })
      .optional(),
  }),
});

const initializeContextExecution = async ({
  inputData,
  runtimeContext,
}: {
  inputData: z.infer<typeof initializeContextStepInputSchema>;
  runtimeContext: RuntimeContext;
}): Promise<z.infer<typeof initializeContextStepOutputSchema>> => {
  // Set runtime context values
  runtimeContext.set(DocsAgentContextKey.Sandbox, inputData.sandbox);
  runtimeContext.set(DocsAgentContextKey.TodoListFile, inputData.todoList);

  if (inputData.clarificationQuestion) {
    runtimeContext.set(DocsAgentContextKey.ClarificationFile, inputData.clarificationQuestion);
  }

  // Also set standard workflow context
  runtimeContext.set('organizationId', inputData.organizationId);
  runtimeContext.set('workflowStartTime', Date.now());

  // Return data for next steps with context initialized
  return {
    message: inputData.message,
    organizationId: inputData.organizationId,
    contextInitialized: true,
    context: {
      sandbox: inputData.sandbox,
      todoList: inputData.todoList,
      clarificationQuestion: inputData.clarificationQuestion,
    },
  };
};

export const initializeContextStep = createStep({
  id: 'initialize-context',
  description: 'Initializes the runtime context with DocsAgent specific values',
  inputSchema: initializeContextStepInputSchema,
  outputSchema: initializeContextStepOutputSchema,
  execute: initializeContextExecution,
});
