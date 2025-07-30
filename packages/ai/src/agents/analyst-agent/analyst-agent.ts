import { type ModelMessage, streamText } from 'ai';
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

const DEFAULT_OPTIONS = {
  maxSteps: 18,
  temperature: 0,
  maxTokens: 10000,
  providerOptions: {
    anthropic: {
      disableParallelToolCalls: true,
    },
  },
};

const DEFAULT_CACHE_OPTIONS = {
  anthropic: { cacheControl: { type: 'ephemeral', ttl: '1h' } },
};

const AnalystAgentSchema = z.object({
  sql_dialect_guidance: z.string().describe('The SQL dialect guidance for the analyst agent.'),
});

const AnalystStreamSchema = z.object({
  messages: z
    .array(z.custom<ModelMessage>())
    .describe('The messages to send to the analyst agent.'),
});

export type AnalystAgentSchema = z.infer<typeof AnalystAgentSchema>;
export type AnalystStreamSchema = z.infer<typeof AnalystStreamSchema>;



export function createAnalystAgent(analystAgentSchema: AnalystAgentSchema) {
  const steps: never[] = [];

  const systemMessage = {
    role: 'system',
    content: getAnalystAgentSystemPrompt(analystAgentSchema.sql_dialect_guidance),
    providerOptions: DEFAULT_CACHE_OPTIONS,
  } as ModelMessage;

  async function stream({ messages }: AnalystStreamSchema) {
    return wrapTraced(
      async () =>
        streamText({
          model: Sonnet4,
          tools: { createMetrics, modifyMetrics, createDashboards, modifyDashboards, doneTool },
          messages: [systemMessage, ...messages],
          stopWhen:  
          ...DEFAULT_OPTIONS,
        }),
      {
        name: 'Analyst Agent',
      }
    );
  }

  async function getSteps() {
    return steps;
  }

  return {
    stream,
    getSteps,
  };
}
