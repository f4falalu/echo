import { createOpenAI } from '@ai-sdk/openai';
import { wrapAISDKModel } from 'braintrust';

export const openaiModel = (modelId: string) => {
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Wrap the model with Braintrust tracing and return it
  return wrapAISDKModel(openai(modelId));
};