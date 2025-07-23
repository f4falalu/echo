import type { Sandbox } from '@buster/sandbox';
import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import { z } from 'zod';
import { DocsAgentContextKey } from '../../context/docs-agent-context';
import type { MessageUserClarifyingQuestion } from '../../context/docs-agent-context';

const docsAgentStepInputSchema = z.object({
  todos: z.array(z.string()),
  todoList: z.string(),
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

const docsAgentStepOutputSchema = z.object({
  todos: z.array(z.string()).optional(),
  todoList: z.string().optional(),
  documentationCreated: z.boolean().optional(),
  clarificationNeeded: z.boolean().optional(),
  clarificationQuestion: z
    .object({
      issue: z.string(),
      context: z.string(),
      clarificationQuestion: z.string(),
    })
    .optional(),
  finished: z.boolean().optional(),
  metadata: z
    .object({
      filesCreated: z.number().optional(),
      toolsUsed: z.array(z.string()).optional(),
    })
    .optional(),
});

const docsAgentExecution = async ({
  inputData,
  runtimeContext,
}: {
  inputData: z.infer<typeof docsAgentStepInputSchema>;
  runtimeContext: RuntimeContext;
}): Promise<z.infer<typeof docsAgentStepOutputSchema>> => {
  // Access values from runtime context
  const sandbox = runtimeContext.get(DocsAgentContextKey.Sandbox) as Sandbox;
  const todoList = runtimeContext.get(DocsAgentContextKey.TodoListFile) as string;
  const clarificationQuestion = runtimeContext.get(DocsAgentContextKey.ClarificationFile) as
    | MessageUserClarifyingQuestion
    | undefined;

  // Also access standard workflow context
  const organizationId = runtimeContext.get('organizationId') as string;
  const workflowStartTime = runtimeContext.get('workflowStartTime') as number;

  console.info('[DocsAgent] Runtime context values:', {
    hasSandbox: !!sandbox,
    todoList,
    hasClarificationQuestion: !!clarificationQuestion,
    organizationId,
    workflowStartTime,
  });

  // TODO: Implement the docs agent logic
  // This step should:
  // 1. Process the todos using the sandbox
  // 2. Create documentation files
  // 3. Handle clarification questions if needed

  // Example of how to use sandbox (when implemented):
  // const result = await sandbox.execute('console.log("Hello from sandbox")');

  // If you need to update clarification question:
  // runtimeContext.set(DocsAgentContextKey.ClarificationFile, newClarificationQuestion);

  return {
    todos: inputData.todos,
    todoList: inputData.todoList,
    documentationCreated: false,
    clarificationNeeded: false,
    finished: true,
    metadata: {
      filesCreated: 0,
      toolsUsed: [],
    },
  };
};

export const docsAgentStep = createStep({
  id: 'docs-agent',
  description: 'Main documentation agent that processes todos and creates documentation',
  inputSchema: docsAgentStepInputSchema,
  outputSchema: docsAgentStepOutputSchema,
  execute: docsAgentExecution,
});
