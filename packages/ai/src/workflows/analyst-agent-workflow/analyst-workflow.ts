// input for the workflow

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
});

export type AnalystWorkflowInput = z.infer<typeof AnalystWorkflowInputSchema>;

export async function runAnalystWorkflow(input: AnalystWorkflowInput) {
  const { messages } = input;

  const { todos, values } = await runAnalystPrepSteps(input);

  if (values.valuesMessage) {
    messages.push(values.valuesMessage);
  }

  messages.push(todos.todosMessage);

  const thinkAndPrepAgentStepResults = await runThinkAndPrepAgentStep({
    options: {
      messageId: input.messageId,
      chatId: input.chatId,
      organizationId: input.organizationId,
      dataSourceId: input.dataSourceId,
      dataSourceSyntax: input.dataSourceSyntax,
      userId: input.userId,
      sql_dialect_guidance: input.dataSourceSyntax,
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
