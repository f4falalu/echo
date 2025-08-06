import { type ModelMessage, hasToolCall, stepCountIs, streamText } from 'ai';
import { wrapTraced } from 'braintrust';
import z from 'zod';
import { createAnalystTools } from '../../tools/tool-factories';
import { Sonnet4 } from '../../utils/models/sonnet-4';
import { injectAgentContext } from '../helpers/context/agent-context-injection';
import { getAnalystAgentSystemPrompt } from './get-analyst-agent-system-prompt';

const DEFAULT_CACHE_OPTIONS = {
  anthropic: { cacheControl: { type: 'ephemeral', ttl: '1h' } },
};

const STOP_CONDITIONS = [stepCountIs(25), hasToolCall('doneTool')];

const AnalystAgentOptionsSchema = z.object({
  userId: z.string(),
  chatId: z.string(),
  dataSourceId: z.string(),
  dataSourceSyntax: z.string(),
  organizationId: z.string(),
  messageId: z.string().optional(),
});

const AnalystStreamOptionsSchema = z.object({
  messages: z
    .array(z.custom<ModelMessage>())
    .describe('The messages to send to the analyst agent.'),
});

export type AnalystAgentOptions = z.infer<typeof AnalystAgentOptionsSchema>;
export type AnalystStreamOptions = z.infer<typeof AnalystStreamOptionsSchema>;

export function createAnalystAgent(analystAgentOptions: AnalystAgentOptions) {
  const steps: never[] = [];

  const systemMessage = {
    role: 'system',
    content: getAnalystAgentSystemPrompt(analystAgentOptions.dataSourceSyntax),
    providerOptions: DEFAULT_CACHE_OPTIONS,
  } as ModelMessage;

  // Create tools with session context baked in
  const tools = createAnalystTools(analystAgentOptions);

  async function stream({ messages }: AnalystStreamOptions) {
    return wrapTraced(
      () =>
        streamText({
          model: Sonnet4,
          tools,
          messages: [systemMessage, ...messages],
          stopWhen: STOP_CONDITIONS,
          toolChoice: 'required',
          maxOutputTokens: 10000,
          temperature: 0,
          experimental_context: analystAgentOptions,
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
