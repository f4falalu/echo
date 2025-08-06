import { type ModelMessage, hasToolCall, stepCountIs, streamText } from 'ai';
import { wrapTraced } from 'braintrust';
import z from 'zod';
import {
  createDashboards,
  createMetrics,
  doneTool,
  modifyDashboards,
  modifyMetrics,
} from '../../tools';
import { Sonnet4 } from '../../utils/models/sonnet-4';
import { getAnalystAgentSystemPrompt } from './get-analyst-agent-system-prompt';

const DEFAULT_CACHE_OPTIONS = {
  anthropic: { cacheControl: { type: 'ephemeral', ttl: '1h' } },
};

const STOP_CONDITIONS = [stepCountIs(18), hasToolCall('doneTool')];

const AnalystAgentOptionsSchema = z.object({
  sql_dialect_guidance: z.string().describe('The SQL dialect guidance for the analyst agent.'),
});

const AnalystStreamOptionsSchema = z.object({
  messages: z
    .array(z.custom<ModelMessage>())
    .describe('The messages to send to the analyst agent.'),
});

export type AnalystAgentOptionsSchema = z.infer<typeof AnalystAgentOptionsSchema>;
export type AnalystStreamOptions = z.infer<typeof AnalystStreamOptionsSchema>;

export function createAnalystAgent(analystAgentSchema: AnalystAgentOptionsSchema) {
  const steps: never[] = [];

  const systemMessage = {
    role: 'system',
    content: getAnalystAgentSystemPrompt(analystAgentSchema.sql_dialect_guidance),
    providerOptions: DEFAULT_CACHE_OPTIONS,
  } as ModelMessage;

  async function stream({ messages }: AnalystStreamOptions) {
    return wrapTraced(
      () =>
        streamText({
          model: Sonnet4,
          tools: {
            createMetrics,
            modifyMetrics,
            createDashboards,
            modifyDashboards,
            doneTool,
          },
          messages: [systemMessage, ...messages],
          stopWhen: STOP_CONDITIONS,
          toolChoice: 'required',
          maxOutputTokens: 10000,
          temperature: 0,
        }),
      {
        name: 'Analyst Agent',
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
