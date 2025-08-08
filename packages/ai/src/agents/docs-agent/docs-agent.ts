import type { Sandbox } from '@buster/sandbox';
import { type ModelMessage, hasToolCall, stepCountIs, streamText } from 'ai';
import { wrapTraced } from 'braintrust';
import z from 'zod';
import {
  bashExecute,
  checkOffTodoList,
  createFiles,
  createIdleTool,
  createSequentialThinkingTool,
  deleteFiles,
  editFiles,
  executeSqlDocsAgent,
  grepSearch,
  listFiles,
  readFiles,
  updateClarificationsFile,
  webSearch,
} from '../../tools';
import { Sonnet4 } from '../../utils/models/sonnet-4';
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

  async function stream({ messages }: DocsStreamOptions) {
    return wrapTraced(
      () =>
        streamText({
          model: Sonnet4,
          tools: {
            sequentialThinking: createSequentialThinkingTool({
              messageId: docsAgentOptions.messageId,
            }),
            grepSearch,
            readFiles,
            editFiles,
            createFiles,
            deleteFiles,
            listFiles,
            executeSql: executeSqlDocsAgent,
            bashExecute,
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
