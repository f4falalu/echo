import type { LanguageModelV2 } from '@ai-sdk/provider';
import { createFallback } from './ai-fallback';
import { anthropicModel } from './providers/anthropic';
import { openaiModel } from './providers/openai';

// Lazy initialization to allow mocking in tests
let _sonnet4Instance: ReturnType<typeof createFallback> | null = null;

function initializeSonnet4(): ReturnType<typeof createFallback> {
  if (_sonnet4Instance) {
    return _sonnet4Instance;
  }

  // Build models array based on available credentials
  const models: LanguageModelV2[] = [];

  // Only include Anthropic if API key is available
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      models.push(anthropicModel('claude-4-sonnet-20250514'));
      console.info('Sonnet4: Anthropic model added to fallback chain (primary)');
    } catch (error) {
      console.warn('Sonnet4: Failed to initialize Anthropic model:', error);
    }
  } else {
    console.info('Sonnet4: No ANTHROPIC_API_KEY found, skipping Anthropic model');
  }

  // Ensure we have at least one model
  if (models.length === 0) {
    throw new Error(
      'No AI models available. Please set either Vertex AI (VERTEX_CLIENT_EMAIL and VERTEX_PRIVATE_KEY) or Anthropic (ANTHROPIC_API_KEY) credentials.'
    );
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      models.push(openaiModel('gpt-5'));
      console.info('Sonnet4: OpenAI model added to fallback chain');
    } catch (error) {
      console.warn('Sonnet4: Failed to initialize OpenAI model:', error);
    }
  }

  console.info(`Sonnet4: Initialized with ${models.length} model(s) in fallback chain`);

  _sonnet4Instance = createFallback({
    models,
    modelResetInterval: 60000,
    retryAfterOutput: true,
    onError: (err, modelId) => {
      // Handle various error formats
      let errorMessage = 'Unknown error';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object') {
        const errObj = err as Record<string, unknown>;
        if ('message' in errObj) {
          errorMessage = String(errObj.message);
        }
        if ('type' in errObj) {
          errorMessage = `${errObj.type}: ${errObj.message || 'No message'}`;
        }
      } else {
        errorMessage = String(err);
      }

      const errorDetails =
        err instanceof Error && err.stack ? err.stack : JSON.stringify(err, null, 2);
      console.error(`FALLBACK from model ${modelId}. Error: ${errorMessage}`);
      console.error('Error details:', errorDetails);
    },
  });

  return _sonnet4Instance;
}

// Export a proxy that initializes on first use
export const Sonnet4 = new Proxy({} as ReturnType<typeof createFallback>, {
  get(_target, prop) {
    const instance = initializeSonnet4();
    // Direct property access without receiver to avoid proxy conflicts
    return instance[prop as keyof typeof instance];
  },
  has(_target, prop) {
    const instance = initializeSonnet4();
    return prop in instance;
  },
  ownKeys(_target) {
    const instance = initializeSonnet4();
    return Reflect.ownKeys(instance);
  },
  getOwnPropertyDescriptor(_target, prop) {
    const instance = initializeSonnet4();
    return Reflect.getOwnPropertyDescriptor(instance, prop);
  },
});
