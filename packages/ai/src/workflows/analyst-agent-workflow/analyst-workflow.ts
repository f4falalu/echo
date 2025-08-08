// input for the workflow

import type { ModelMessage } from 'ai';
import { z } from 'zod';
import {
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

  const analystPrepResults = await runAnalystPrepSteps(input);

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

  const analystAgentStepResults = await runAnalystAgentStep({
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

async function runAnalystPrepSteps(input: AnalystWorkflowInput) {
  const todos = await runCreateTodosStep({
    options: {
      messageId: input.messageId,
      chatId: input.chatId,
      organizationId: input.organizationId,
      dataSourceId: input.dataSourceId,
      dataSourceSyntax: input.dataSourceSyntax,
    },
  });

  const values = await runExtractValuesAndSearchStep({
    options: {
      messageId: input.messageId,
      chatId: input.chatId,
      organizationId: input.organizationId,
      dataSourceId: input.dataSourceId,
      dataSourceSyntax: input.dataSourceSyntax,
    },
  });

  const chatTitle = await runGenerateChatTitleStep({
    options: {
      messageId: input.messageId,
      chatId: input.chatId,
      organizationId: input.organizationId,
      dataSourceId: input.dataSourceId,
      dataSourceSyntax: input.dataSourceSyntax,
    },
  });
}
