import { createAnthropic } from '@ai-sdk/anthropic';
import { wrapAISDKModel } from 'braintrust';

export const anthropicModel = (modelId: string) => {
  const anthropic = createAnthropic({
    headers: {
      'anthropic-beta': 'fine-grained-tool-streaming-2025-05-14',
    },
  });

  // Wrap the model with Braintrust tracing and return it
  return wrapAISDKModel(anthropic(modelId));
};
