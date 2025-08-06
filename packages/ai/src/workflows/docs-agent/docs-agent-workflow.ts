import { createWorkflow } from '@mastra/core';
import { z } from 'zod';
import { DocsAgentContextSchema } from '../../agents/docs-agent/docs-agent-context';
import { createDocsTodosStep } from '../../steps/docs-agent/create-docs-todos-step';
import { docsAgentStep } from '../../steps/docs-agent/docs-agent-step';
import { getRepositoryTreeStep } from '../../steps/docs-agent/get-repository-tree-step';
import { initializeContextStep } from '../../steps/docs-agent/initialize-context-step';

// Input schema for the workflow - matches what initialize-context-step expects
const docsAgentWorkflowInputSchema = z.object({
  message: z.string(),
  organizationId: z.string(),
  // Use the DocsAgentContextSchema directly to ensure exact match
  context: DocsAgentContextSchema,
});

// Output schema for the workflow
const docsAgentWorkflowOutputSchema = z.object({
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

// Create the workflow with initialization step first
const docsAgentWorkflow = createWorkflow({
  id: 'docs-agent-workflow',
  inputSchema: docsAgentWorkflowInputSchema,
  outputSchema: docsAgentWorkflowOutputSchema,
  steps: [initializeContextStep, getRepositoryTreeStep, createDocsTodosStep, docsAgentStep],
})
  .then(initializeContextStep) // First step: initialize runtime context
  .then(getRepositoryTreeStep) // Get repository tree structure
  .then(createDocsTodosStep) // Then create todos
  .then(docsAgentStep) // Finally run the agent
  .commit();

export default docsAgentWorkflow;
export { docsAgentWorkflowInputSchema, docsAgentWorkflowOutputSchema };
