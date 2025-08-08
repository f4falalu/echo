import type { Sandbox } from '@buster/sandbox';
import { type ModelMessage, hasToolCall, stepCountIs, streamText } from 'ai';
import { wrapTraced } from 'braintrust';
import z from 'zod';
import { Sonnet4 } from '../../models/sonnet-4';
import {
  checkOffTodoList,
  createBashTool,
  createCreateFilesTool,
  createDeleteFilesTool,
  createEditFilesTool,
  createGrepSearchTool,
  createIdleTool,
  createListFilesTool,
  createReadFilesTool,
  createSequentialThinkingTool,
  executeSqlDocsAgent,
  updateClarificationsFile,
  webSearch,
} from '../../tools';
import { healToolWithLlm } from '../../utils/tool-call-repair';
import { getDocsAgentSystemPrompt } from './get-docs-agent-system-prompt';

const DEFAULT_CACHE_OPTIONS = {
  anthropic: { cacheControl: { type: 'ephemeral', ttl: '1h' } },
};

const STOP_CONDITIONS = [stepCountIs(50), hasToolCall('idleTool')];

const DocsAgentOptionsSchema = z.object({
  folder_structure: z.string().describe('The file structure of the dbt repository'),
  userId: z.string(),
  chatId: z.string(),
  dataSourceId: z.string(),
  organizationId: z.string(),
  messageId: z.string().optional(),
  sandbox: z
    .custom<Sandbox>(
      (val) => {
        return val && typeof val === 'object' && 'id' in val && 'fs' in val;
      },
      { message: 'Invalid Sandbox instance' }
    )
    .optional(),
});

const DocsStreamOptionsSchema = z.object({
  messages: z.array(z.custom<ModelMessage>()).describe('The messages to send to the docs agent'),
});

export type DocsAgentOptions = z.infer<typeof DocsAgentOptionsSchema>;
export type DocsStreamOptions = z.infer<typeof DocsStreamOptionsSchema>;

// Extended type for passing to tools (includes sandbox)
export type DocsAgentContextWithSandbox = DocsAgentOptions & { sandbox: Sandbox };

export function createDocsAgent(docsAgentOptions: DocsAgentOptions) {
  const steps: never[] = [];

  const systemMessage = {
    role: 'system',
    content: getDocsAgentSystemPrompt(docsAgentOptions.folder_structure),
    providerOptions: DEFAULT_CACHE_OPTIONS,
  } as ModelMessage;

  const idleTool = createIdleTool({ messageId: docsAgentOptions.messageId });

  // Create tool context with messageId and sandbox if available
  const toolContext = {
    messageId: docsAgentOptions.messageId || 'default',
    sandbox: docsAgentOptions.sandbox,
  };

  // Create file tools with context (only if sandbox is available)
  const listFiles = docsAgentOptions.sandbox ? createListFilesTool(toolContext as any) : undefined;
  const readFiles = docsAgentOptions.sandbox ? createReadFilesTool(toolContext as any) : undefined;
  const createFiles = docsAgentOptions.sandbox ? createCreateFilesTool(toolContext as any) : undefined;
  const editFiles = docsAgentOptions.sandbox ? createEditFilesTool(toolContext as any) : undefined;
  const deleteFiles = docsAgentOptions.sandbox ? createDeleteFilesTool(toolContext as any) : undefined;
  const bashExecute = docsAgentOptions.sandbox ? createBashTool(toolContext as any) : undefined;
  const grepSearch = docsAgentOptions.sandbox ? createGrepSearchTool(toolContext as any) : undefined;

  async function stream({ messages }: DocsStreamOptions) {
    return wrapTraced(
      () =>
        streamText({
          model: Sonnet4,
          tools: {
            sequentialThinking: createSequentialThinkingTool({
              messageId: docsAgentOptions.messageId,
            }),
            ...(grepSearch && { grepSearch }),
            ...(readFiles && { readFiles }),
            ...(editFiles && { editFiles }),
            ...(createFiles && { createFiles }),
            ...(deleteFiles && { deleteFiles }),
            ...(listFiles && { listFiles }),
            executeSql: executeSqlDocsAgent,
            ...(bashExecute && { bashExecute }),
            updateClarificationsFile,
            checkOffTodoList,
            idleTool,
            webSearch,
          },
          messages: [systemMessage, ...messages],
          stopWhen: STOP_CONDITIONS,
          toolChoice: 'required',
          maxOutputTokens: 10000,
          temperature: 0,
          experimental_context: docsAgentOptions,
          experimental_repairToolCall: healToolWithLlm,
        }),
      {
        name: 'Docs Agent',
      }
    )();
  }

  async function getSteps() {
    return steps;
  }

  return {
    stream,
    getSteps,
  };
}
