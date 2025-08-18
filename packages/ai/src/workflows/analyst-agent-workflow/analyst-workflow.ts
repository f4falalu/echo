// input for the workflow

import type { PermissionedDataset } from '@buster/access-controls';
import type { ModelMessage } from 'ai';
import { z } from 'zod';
import {
  type CreateTodosResult,
  type ExtractValuesSearchResult,
  runAnalystAgentStep,
  runCreateTodosStep,
  runExtractValuesAndSearchStep,
  runGenerateChatTitleStep,
  runThinkAndPrepAgentStep,
} from '../../steps';

const AnalystWorkflowInputSchema = z.object({
  messages: z.array(z.custom<ModelMessage>()),
  messageId: z.string().uuid(),
  chatId: z.string().uuid(),
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  dataSourceId: z.string().uuid(),
  dataSourceSyntax: z.string(),
  datasets: z.array(z.custom<PermissionedDataset>()),
});

export type AnalystWorkflowInput = z.infer<typeof AnalystWorkflowInputSchema>;

export async function runAnalystWorkflow(input: AnalystWorkflowInput) {
  const workflowStartTime = Date.now();

  const { messages } = input;

  const { todos, values } = await runAnalystPrepSteps(input);

  // Add all messages from extract-values step (tool call, result, and optional user message)
  messages.push(...values.messages);

  // Add all messages from create-todos step (tool call, result, and user message)
  messages.push(...todos.messages);

  const thinkAndPrepAgentStepResults = await runThinkAndPrepAgentStep({
    options: {
      messageId: input.messageId,
      chatId: input.chatId,
      organizationId: input.organizationId,
      dataSourceId: input.dataSourceId,
      dataSourceSyntax: input.dataSourceSyntax,
      userId: input.userId,
      sql_dialect_guidance: input.dataSourceSyntax,
      datasets: input.datasets,
      workflowStartTime,
    },
    streamOptions: {
      messages,
    },
  });

  messages.push(...thinkAndPrepAgentStepResults.messages);

  await runAnalystAgentStep({
    options: {
      messageId: input.messageId,
      chatId: input.chatId,
      organizationId: input.organizationId,
      dataSourceId: input.dataSourceId,
      dataSourceSyntax: input.dataSourceSyntax,
      userId: input.userId,
      datasets: input.datasets,
      workflowStartTime,
    },
    streamOptions: {
      messages,
    },
  });
}

const AnalystPrepStepSchema = z.object({
  messages: z.array(z.custom<ModelMessage>()),
  dataSourceId: z.string().uuid(),
  chatId: z.string().uuid(),
  messageId: z.string().uuid(),
});

type AnalystPrepStepInput = z.infer<typeof AnalystPrepStepSchema>;

async function runAnalystPrepSteps({
  messages,
  dataSourceId,
  chatId,
  messageId,
}: AnalystPrepStepInput): Promise<{
  todos: CreateTodosResult;
  values: ExtractValuesSearchResult;
}> {
  const [todos, values] = await Promise.all([
    runCreateTodosStep({
      messages,
      messageId,
    }),
    runExtractValuesAndSearchStep({
      messages,
      dataSourceId,
    }),
    runGenerateChatTitleStep({
      messages,
      chatId,
      messageId,
    }),
  ]);

  return { todos, values };
}
