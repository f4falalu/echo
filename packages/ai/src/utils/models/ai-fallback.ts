import type {
  LanguageModelV1,
  LanguageModelV1CallOptions,
  LanguageModelV1CallWarning,
  LanguageModelV1FinishReason,
  LanguageModelV1FunctionToolCall,
  LanguageModelV1StreamPart,
} from '@ai-sdk/provider';

interface Settings {
  models: LanguageModelV1[];
  retryAfterOutput?: boolean;
  modelResetInterval?: number;
  shouldRetryThisError?: (error: Error) => boolean;
  onError?: (error: Error, modelId: string) => void | Promise<void>;
}

export function createFallback(settings: Settings): FallbackModel {
  return new FallbackModel(settings);
}

const retryableStatusCodes = [
  401, // wrong API key
  403, // permission error, like cannot access model or from a non accessible region
  408, // request timeout
  409, // conflict
  413, // payload too large
  429, // too many requests/rate limits
  500, // server error (and above)
];
// Common error messages/codes that indicate server overload or temporary issues
const retryableErrors = [
  'overloaded',
  'service unavailable',
  'bad gateway',
  'too many requests',
  'internal server error',
  'gateway timeout',
  'rate_limit',
  'wrong-key',
  'unexpected',
  'capacity',
  'timeout',
  'server_error',
  '429', // Too Many Requests
  '500', // Internal Server Error
  '502', // Bad Gateway
  '503', // Service Unavailable
  '504', // Gateway Timeout
];

function defaultShouldRetryThisError(error: unknown): boolean {
  const statusCode = (error as { statusCode?: number })?.statusCode;

  if (statusCode && (retryableStatusCodes.includes(statusCode) || statusCode > 500)) {
    return true;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const errorString = (error as Error).message.toLowerCase() || '';
    return retryableErrors.some((errType) => errorString.includes(errType));
  }
  if (error && typeof error === 'object') {
    const errorString = JSON.stringify(error).toLowerCase() || '';
    return retryableErrors.some((errType) => errorString.includes(errType));
  }
  return false;
}

export class FallbackModel implements LanguageModelV1 {
  readonly specificationVersion = 'v1' as const;

  get modelId(): string {
    const currentModel = this.settings.models[this.currentModelIndex];
    return currentModel ? currentModel.modelId : 'fallback-model';
  }

  get provider(): string {
    const currentModel = this.settings.models[this.currentModelIndex];
    return currentModel ? currentModel.provider : 'fallback';
  }

  get defaultObjectGenerationMode(): 'json' | 'tool' | undefined {
    const currentModel = this.settings.models[this.currentModelIndex];
    return currentModel?.defaultObjectGenerationMode;
  }

  readonly settings: Settings;
  currentModelIndex = 0;
  private lastModelReset: number = Date.now();
  private readonly modelResetInterval: number;
  retryAfterOutput: boolean;

  constructor(settings: Settings) {
    this.settings = settings;
    this.modelResetInterval = settings.modelResetInterval ?? 3 * 60 * 1000; // Default 3 minutes in ms
    this.retryAfterOutput = settings.retryAfterOutput ?? false;

    if (!this.settings.models[this.currentModelIndex]) {
      throw new Error('No models available in settings');
    }
  }

  private checkAndResetModel() {
    const now = Date.now();
    if (now - this.lastModelReset >= this.modelResetInterval && this.currentModelIndex !== 0) {
      this.currentModelIndex = 0;
      this.lastModelReset = now;
    }
  }

  private switchToNextModel() {
    this.currentModelIndex = (this.currentModelIndex + 1) % this.settings.models.length;
  }

  private async retry<T>(fn: () => PromiseLike<T>): Promise<T> {
    let lastError: Error | undefined;
    let attempts = 0;
    const maxAttempts = this.settings.models.length;

    while (attempts < maxAttempts) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        attempts++;

        // Only retry if it's a server/capacity error
        const shouldRetry = this.settings.shouldRetryThisError || defaultShouldRetryThisError;
        if (!shouldRetry(lastError)) {
          throw lastError;
        }

        if (this.settings.onError) {
          await this.settings.onError(lastError, this.modelId);
        }

        // If we've tried all models, throw the last error
        if (attempts >= maxAttempts) {
          throw lastError;
        }

        this.switchToNextModel();
      }
    }

    // This should never be reached
    throw lastError || new Error('Unexpected retry state');
  }

  doGenerate(
    options: LanguageModelV1CallOptions
  ): PromiseLike<Awaited<ReturnType<LanguageModelV1['doGenerate']>>> {
    this.checkAndResetModel();
    return this.retry(() => {
      const currentModel = this.settings.models[this.currentModelIndex];
      if (!currentModel) {
        throw new Error('No model available');
      }
      return currentModel.doGenerate(options);
    });
  }

  doStream(
    options: LanguageModelV1CallOptions
  ): PromiseLike<Awaited<ReturnType<LanguageModelV1['doStream']>>> {
    this.checkAndResetModel();
    const self = this;
    return this.retry(async () => {
      const currentModel = self.settings.models[self.currentModelIndex];
      if (!currentModel) {
        throw new Error('No model available');
      }
      const result = await currentModel.doStream(options);

      let hasStreamedAny = false;
      // Wrap the stream to handle errors and switch providers if needed
      const wrappedStream = new ReadableStream<LanguageModelV1StreamPart>({
        async start(controller) {
          try {
            const reader = result.stream.getReader();

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
              hasStreamedAny = true;
            }
            controller.close();
          } catch (error) {
            if (self.settings.onError) {
              await self.settings.onError(error as Error, self.modelId);
            }
            if (!hasStreamedAny || self.retryAfterOutput) {
              // If nothing was streamed yet, switch models and retry
              self.switchToNextModel();
              try {
                const nextResult = await self.doStream(options);
                const nextReader = nextResult.stream.getReader();
                while (true) {
                  const { done, value } = await nextReader.read();
                  if (done) break;
                  controller.enqueue(value);
                }
                controller.close();
              } catch (nextError) {
                controller.error(nextError);
              }
              return;
            }
            controller.error(error);
          }
        },
      });

      return {
        ...result,
        stream: wrappedStream,
      };
    });
  }
}
