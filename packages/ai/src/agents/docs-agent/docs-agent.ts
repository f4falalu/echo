import { type ModelMessage, hasToolCall, stepCountIs, streamText } from 'ai';
import { wrapTraced } from 'braintrust';
import z from 'zod';
import {
  bashExecute,
  checkOffTodoList,
  createFiles,
  deleteFiles,
  editFiles,
  executeSqlDocsAgent,
  grepSearch,
  idleTool,
  listFiles,
  readFiles,
  sequentialThinking,
  updateClarificationsFile,
  webSearch,
} from '../../tools';
import { Sonnet4 } from '../../utils/models/sonnet-4';
import { getDocsAgentSystemPrompt } from './get-docs-agent-system-prompt';

const DEFAULT_CACHE_OPTIONS = {
  anthropic: { cacheControl: { type: 'ephemeral', ttl: '1h' } },
};

const STOP_CONDITIONS = [stepCountIs(50), hasToolCall('idleTool')];

const DocsAgentOptionsSchema = z.object({
  folder_structure: z.string().describe('The file structure of the dbt repository'),
});

const DocsStreamOptionsSchema = z.object({
  messages: z.array(z.custom<ModelMessage>()).describe('The messages to send to the docs agent'),
});

export type DocsAgentOptions = z.infer<typeof DocsAgentOptionsSchema>;
export type DocsStreamOptions = z.infer<typeof DocsStreamOptionsSchema>;

export function createDocsAgent(options: DocsAgentOptions) {
  const steps: never[] = [];

  const systemMessage = {
    role: 'system',
    content: getDocsAgentSystemPrompt(options.folder_structure),
    providerOptions: DEFAULT_CACHE_OPTIONS,
  } as ModelMessage;

  async function stream({ messages }: DocsStreamOptions) {
    return wrapTraced(
      () =>
        streamText({
          model: Sonnet4,
          tools: {
            sequentialThinking,
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
