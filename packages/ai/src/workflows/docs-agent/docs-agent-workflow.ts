import type { Sandbox } from '@buster/sandbox';
import { createWorkflow } from '@mastra/core';
import { z } from 'zod';
import { ClarifyingQuestionSchema } from '../../context/docs-agent-context';
import { createDocsTodosStep } from '../../steps/docs-agent/create-docs-todos-step';
import { docsAgentStep } from '../../steps/docs-agent/docs-agent-step';
import { initializeContextStep } from '../../steps/docs-agent/initialize-context-step';

// Input schema for the workflow - now accepts context values directly
const docsAgentWorkflowInputSchema = z.object({
  message: z.string(),
  organizationId: z.string(),
  // Direct context values instead of nested object
  sandbox: z.custom<Sandbox>(
    (val) => {
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
  clarificationQuestions: z.array(ClarifyingQuestionSchema).optional(),
  dataSourceId: z.string().uuid().optional(),
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
  steps: [initializeContextStep, createDocsTodosStep, docsAgentStep],
})
  .then(initializeContextStep) // First step: initialize runtime context
  .then(createDocsTodosStep) // Then create todos
  .then(docsAgentStep) // Finally run the agent
  .commit();

export default docsAgentWorkflow;
export { docsAgentWorkflowInputSchema, docsAgentWorkflowOutputSchema };
