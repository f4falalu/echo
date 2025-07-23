import type { Sandbox } from '@buster/sandbox';
import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { z } from 'zod';
import { DocsAgentContextKeys, DocsAgentContextSchema } from '../../context/docs-agent-context';

// Input schema matches the workflow input schema
const initializeContextStepInputSchema = z.object({
  message: z.string(),
  organizationId: z.string(),
  context: DocsAgentContextSchema,
});

// Output schema includes the input data plus a context object
const initializeContextStepOutputSchema = z.object({
  message: z.string(),
  organizationId: z.string(),
  // Use the DocsAgentContextSchema for the context
  context: DocsAgentContextSchema,
});

const initializeContextExecution = async ({
  inputData,
  runtimeContext,
}: {
  inputData: z.infer<typeof initializeContextStepInputSchema>;
  runtimeContext: RuntimeContext;
}): Promise<z.infer<typeof initializeContextStepOutputSchema>> => {
  // Set runtime context values
  runtimeContext.set(DocsAgentContextKeys.Sandbox, inputData.context.sandbox);
  runtimeContext.set(DocsAgentContextKeys.TodoList, inputData.context.todoList);
  runtimeContext.set(DocsAgentContextKeys.DataSourceId, inputData.context.dataSourceId);

  if (inputData.context.clarificationQuestions.length > 0) {
    runtimeContext.set(
      DocsAgentContextKeys.ClarificationQuestions,
      inputData.context.clarificationQuestions
    );
  }

  // Also set standard workflow context
  runtimeContext.set('organizationId', inputData.organizationId);
  runtimeContext.set('workflowStartTime', Date.now());

  // Return data for next steps with context initialized
  return {
    message: inputData.message,
    organizationId: inputData.organizationId,
    context: {
      sandbox: inputData.context.sandbox,
      todoList: inputData.context.todoList,
      clarificationQuestions: inputData.context.clarificationQuestions,
      dataSourceId: inputData.context.dataSourceId,
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
