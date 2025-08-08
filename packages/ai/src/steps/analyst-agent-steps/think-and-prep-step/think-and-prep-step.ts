import type { ModelMessage } from 'ai';
import { z } from 'zod';
import {
  ThinkAndPrepAgentOptionsSchema,
  ThinkAndPrepStreamOptionsSchema,
  createThinkAndPrepAgent,
} from '../../../agents/think-and-prep-agent/think-and-prep-agent';

export const RunThinkAndPrepAgentStepInputSchema = z.object({
  options: ThinkAndPrepAgentOptionsSchema,
  streamOptions: ThinkAndPrepStreamOptionsSchema,
});

export const RunThinkAndPrepAgentStepOutputSchema = z.object({
  messages: z.array(z.custom<ModelMessage>()),
});

export type RunThinkAndPrepAgentStepInput = z.infer<typeof RunThinkAndPrepAgentStepInputSchema>;
export type RunThinkAndPrepAgentStepOutput = z.infer<typeof RunThinkAndPrepAgentStepOutputSchema>;

export async function runThinkAndPrepAgentStep({
  options,
  streamOptions,
}: RunThinkAndPrepAgentStepInput): Promise<RunThinkAndPrepAgentStepOutput> {
  try {
    const thinkAndPrepAgent = createThinkAndPrepAgent(options);

    const result = await thinkAndPrepAgent.stream(streamOptions);
    const response = await result.response;

    if (!response || !Array.isArray(response.messages)) {
      throw new Error(
        'Think and prep agent returned an invalid response shape (missing messages array)'
      );
    }

    return {
      messages: response.messages,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error';

    console.error('runThinkAndPrepAgentStep error', {
      message: errorMessage,
      messageId: options?.messageId,
    });

    throw error;
  }
}
