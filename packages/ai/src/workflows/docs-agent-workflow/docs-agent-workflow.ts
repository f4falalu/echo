import { randomUUID } from 'node:crypto';
import type { ModelMessage } from 'ai';
import { z } from 'zod';
import { AnalyticsEngineerAgentContextSchema } from '../../agents/analytics-engineer-agent/analytics-engineer-agent-context';
import {
  runCreateDocsTodosStep,
  runDocsAgentStep,
  runGetRepositoryTreeStep,
  runInitializeContextStep,
} from '../../steps';

// Input schema for the workflow
export const docsAgentWorkflowInputSchema = z.object({
  message: z.string().describe('The user message'),
  organizationId: z.string().describe('The organization ID'),
  context: AnalyticsEngineerAgentContextSchema.describe('The docs agent context'),
});

// Output schema for the workflow
export const docsAgentWorkflowOutputSchema = z.object({
  todos: z.array(z.string()).optional().describe('Array of todos'),
  todoList: z.string().optional().describe('The TODO list'),
  documentationCreated: z.boolean().optional().describe('Whether documentation was created'),
  clarificationNeeded: z.boolean().optional().describe('Whether clarification is needed'),
  clarificationQuestion: z
    .object({
      issue: z.string(),
      context: z.string(),
      clarificationQuestion: z.string(),
    })
    .optional()
    .describe('Clarification question details'),
  finished: z.boolean().optional().describe('Whether the agent finished'),
  metadata: z
    .object({
      filesCreated: z.number().optional(),
      toolsUsed: z.array(z.string()).optional(),
    })
    .optional()
    .describe('Metadata about the execution'),
});

export type DocsAgentWorkflowInput = z.infer<typeof docsAgentWorkflowInputSchema>;
export type DocsAgentWorkflowOutput = z.infer<typeof docsAgentWorkflowOutputSchema>;

/**
 * Runs the documentation agent workflow
 * This workflow processes documentation requests through multiple steps:
 * 1. Initialize context
 * 2. Get repository tree structure
 * 3. Create TODO list for documentation tasks
 * 4. Execute the docs agent to create documentation
 */
export async function runDocsAgentWorkflow(input: DocsAgentWorkflowInput): Promise<void> {
  // Validate input
  const validatedInput = docsAgentWorkflowInputSchema.parse(input);

  // Step 1: Initialize context
  const contextResult = await runInitializeContextStep({
    message: validatedInput.message,
    organizationId: validatedInput.organizationId,
    context: validatedInput.context,
  });

  // Step 2: Get repository tree structure
  const treeResult = await runGetRepositoryTreeStep({
    message: contextResult.message,
    organizationId: contextResult.organizationId,
    contextInitialized: contextResult.contextInitialized,
    context: contextResult.context,
  });

  // Step 3: Create todos based on the message and repository structure
  // Convert the single message to a messages array for the todos step
  const messages: ModelMessage[] = [
    {
      role: 'user',
      content: treeResult.message,
    },
  ];

  const todosResult = await runCreateDocsTodosStep({
    messages,
    repositoryTree: treeResult.repositoryTree,
  });

  // TODO: This is a temporary solution to get a messageId
  const messageId = randomUUID();

  // Step 4: Execute the docs agent with all the prepared data
  const _agentResult = await runDocsAgentStep({
    todos: todosResult.todos,
    todoList: todosResult.todos, // Using todos as todoList
    message: treeResult.message,
    messageId: messageId,
    organizationId: treeResult.organizationId,
    context: treeResult.context,
    repositoryTree: treeResult.repositoryTree,
  });

  // Return the final results from the agent
  return;
}

// Default export for backward compatibility if needed
export default runDocsAgentWorkflow;
