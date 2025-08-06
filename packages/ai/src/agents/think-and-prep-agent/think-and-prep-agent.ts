import { type ModelMessage, hasToolCall, stepCountIs, streamText } from 'ai';
import { wrapTraced } from 'braintrust';
import z from 'zod';
import {
  executeSql,
  messageUserClarifyingQuestion,
  respondWithoutAssetCreation,
  sequentialThinking,
  submitThoughts,
} from '../../tools';
import { Sonnet4 } from '../../utils/models/sonnet-4';
import { getThinkAndPrepAgentSystemPrompt } from './get-think-and-prep-agent-system-prompt';

const DEFAULT_CACHE_OPTIONS = {
  anthropic: { cacheControl: { type: 'ephemeral', ttl: '1h' } },
};

const STOP_CONDITIONS = [
  stepCountIs(25),
  hasToolCall('submitThoughts'),
  hasToolCall('respondWithoutAssetCreation'),
  hasToolCall('messageUserClarifyingQuestion'),
];

const ThinkAndPrepAgentOptionsSchema = z.object({
  sql_dialect_guidance: z
    .string()
    .describe('The SQL dialect guidance for the think and prep agent.'),
});

const ThinkAndPrepStreamOptionsSchema = z.object({
  messages: z
    .array(z.custom<ModelMessage>())
    .describe('The messages to send to the think and prep agent.'),
});

export type ThinkAndPrepAgentOptionsSchema = z.infer<typeof ThinkAndPrepAgentOptionsSchema>;
export type ThinkAndPrepStreamOptions = z.infer<typeof ThinkAndPrepStreamOptionsSchema>;

export function createThinkAndPrepAgent(thinkAndPrepAgentSchema: ThinkAndPrepAgentOptionsSchema) {
  const steps: never[] = [];

  const systemMessage = {
    role: 'system',
    content: getThinkAndPrepAgentSystemPrompt(thinkAndPrepAgentSchema.sql_dialect_guidance),
    providerOptions: DEFAULT_CACHE_OPTIONS,
  } as ModelMessage;

  async function stream({ messages }: ThinkAndPrepStreamOptions) {
    return wrapTraced(
      () =>
        streamText({
          model: Sonnet4,
          tools: {
            sequentialThinking,
            executeSql,
            respondWithoutAssetCreation,
            submitThoughts,
            messageUserClarifyingQuestion,
          },
          messages: [systemMessage, ...messages],
          stopWhen: STOP_CONDITIONS,
          toolChoice: 'required',
          maxOutputTokens: 10000,
          temperature: 0,
        }),
      {
        name: 'Think and Prep Agent',
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
