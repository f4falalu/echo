import type { Sandbox } from '@buster/sandbox';
import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { z } from 'zod';
import { DocsAgentContextKey } from '../../context/docs-agent-context';

const createDocsTodosStepInputSchema = z.object({
  message: z.string(),
  organizationId: z.string(),
  contextInitialized: z.boolean(),
  context: z.object({
    sandbox: z.any(),
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

const createDocsTodosStepOutputSchema = z.object({
  todos: z.array(z.string()),
  todoList: z.string(),
  // Pass through other fields
  message: z.string(),
  organizationId: z.string(),
  context: z.object({
    sandbox: z.any(),
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

const createDocsTodosExecution = async ({
  inputData,
  runtimeContext,
}: {
  inputData: z.infer<typeof createDocsTodosStepInputSchema>;
  runtimeContext: RuntimeContext;
}): Promise<z.infer<typeof createDocsTodosStepOutputSchema>> => {
  // Get the sandbox from runtime context (it was set by initializeContextStep)
  const sandbox = runtimeContext.get(DocsAgentContextKey.Sandbox) as Sandbox;
  const currentTodoList = runtimeContext.get(DocsAgentContextKey.TodoListFile) as string;

  // TODO: Implement the logic to create documentation todos
  // This step should analyze the message and create a list of documentation tasks
  // Now you have access to the sandbox from runtime context!
  // The sandbox and currentTodoList will be used in the actual implementation

  // For now, log to show they're available
  console.info('Sandbox available:', !!sandbox);
  console.info('Current todo list:', currentTodoList);

  const todos: string[] = [];

  // Update the runtime context with the new todo list
  const updatedTodoList = todos.join('\n');
  runtimeContext.set(DocsAgentContextKey.TodoListFile, updatedTodoList);

  // Return the data with todos
  return {
    ...inputData,
    todos,
    todoList: updatedTodoList,
    context: {
      ...inputData.context,
      todoList: updatedTodoList,
    },
  };
};

export const createDocsTodosStep = createStep({
  id: 'create-docs-todos',
  description: 'Creates a list of documentation todos based on the user message',
  inputSchema: createDocsTodosStepInputSchema,
  outputSchema: createDocsTodosStepOutputSchema,
  execute: createDocsTodosExecution,
});
