import { createOpenAI } from '@ai-sdk/openai';
import { wrapLanguageModel } from 'ai';
import { BraintrustMiddleware } from 'braintrust';

export const openaiModel = (modelId: string) => {
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Wrap the model with Braintrust middleware
  return wrapLanguageModel({
    model: openai(modelId),
    middleware: BraintrustMiddleware({ debug: true }),
  });
};
