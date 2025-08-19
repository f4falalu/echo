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
    console.info('[runThinkAndPrepAgentStep] Starting agent stream', {
      messageId: options?.messageId,
      messageCount: streamOptions.messages.length,
    });

    const thinkAndPrepAgent = createThinkAndPrepAgent(options);

    const result = await thinkAndPrepAgent.stream(streamOptions);

    console.info('[runThinkAndPrepAgentStep] Stream started, consuming stream', {
      messageId: options?.messageId,
    });

    // Consume the text stream to ensure the agent continues processing
    if (result.textStream) {
      for await (const _ of result.textStream) {
        // We don't need to do anything with the text chunks,
        // just consume them to keep the stream flowing
      }
    }

    console.info('[runThinkAndPrepAgentStep] Stream consumed, awaiting response', {
      messageId: options?.messageId,
    });

    const response = await result.response;

    console.info('[runThinkAndPrepAgentStep] Response received', {
      messageId: options?.messageId,
      hasResponse: !!response,
      hasMessages: !!response?.messages,
      messageCount: response?.messages?.length,
    });

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
