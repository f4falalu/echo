import type { LanguageModelV1 } from '@ai-sdk/provider';
import { createFallback } from './ai-fallback';
import { anthropicModel } from './providers/anthropic';
import { vertexModel } from './providers/vertex';

// Build models array based on available credentials
const models: LanguageModelV1[] = [];

// Only include Anthropic if API key is available
if (process.env.ANTHROPIC_API_KEY) {
  try {
    models.push(anthropicModel('claude-3-5-haiku-20241022'));
    console.info('Haiku35: Anthropic model added to fallback chain');
  } catch (error) {
    console.warn('Haiku35: Failed to initialize Anthropic model:', error);
  }
}

// // Only include Vertex if credentials are available
if (process.env.VERTEX_CLIENT_EMAIL && process.env.VERTEX_PRIVATE_KEY) {
  try {
    models.push(vertexModel('claude-3-5-haiku@20241022'));
    console.info('Haiku35: Vertex AI model added to fallback chain');
  } catch (error) {
    console.warn('Haiku35: Failed to initialize Vertex AI model:', error);
  }
}

// Ensure we have at least one model
if (models.length === 0) {
  throw new Error(
    'No AI models available. Please set either Vertex AI (VERTEX_CLIENT_EMAIL and VERTEX_PRIVATE_KEY) or Anthropic (ANTHROPIC_API_KEY) credentials.'
  );
}

console.info(`Haiku35: Initialized with ${models.length} model(s) in fallback chain`);

export const Haiku35 = createFallback({
  models,
  modelResetInterval: 60000,
  retryAfterOutput: true,
  onError: (err) => console.error(`FALLBACK.  Here is the error: ${err}`),
});
