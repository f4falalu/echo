import type { ModelMessage } from 'ai';
import { z } from 'zod';
import {
  AnalystAgentOptionsSchema,
  AnalystStreamOptionsSchema,
  createAnalystAgent,
} from '../../../agents/analyst-agent/analyst-agent';

export const RunAnalystAgentStepInputSchema = z.object({
  options: AnalystAgentOptionsSchema,
  streamOptions: AnalystStreamOptionsSchema,
});

export const RunAnalystAgentStepOutputSchema = z.object({
  messages: z.array(z.custom<ModelMessage>()),
});

export type RunAnalystAgentStepInput = z.infer<typeof RunAnalystAgentStepInputSchema>;
export type RunAnalystAgentStepOutput = z.infer<typeof RunAnalystAgentStepOutputSchema>;

export async function runAnalystAgentStep({
  options,
  streamOptions,
}: RunAnalystAgentStepInput): Promise<RunAnalystAgentStepOutput> {
  try {
    const analystAgent = createAnalystAgent(options);

    const result = await analystAgent.stream(streamOptions);
    
    // Consume the text stream to ensure the agent continues processing
    if (result.textStream) {
      for await (const _ of result.textStream) {
        // We don't need to do anything with the text chunks,
        // just consume them to keep the stream flowing
      }
    }
    
    const response = await result.response;

    if (!response || !Array.isArray(response.messages)) {
      throw new Error('Analyst agent returned an invalid response shape (missing messages array)');
    }

    return {
      messages: response.messages,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error';

    console.error('runAnalystAgentStep error', {
      message: errorMessage,
      chatId: options?.chatId,
      messageId: options?.messageId,
      userId: options?.userId,
    });

    throw error;
  }
}
