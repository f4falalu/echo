import type {
  LanguageModelV1,
  LanguageModelV1CallOptions,
  LanguageModelV1FinishReason,
  LanguageModelV1StreamPart,
} from '@ai-sdk/provider';
import { describe, expect, it, vi } from 'vitest';
import { createFallback } from './ai-fallback';

// Memory-safe mock that avoids ReadableStream complexity
function createMemorySafeMockModel(
  id: string,
  shouldFail = false,
  failureError?: Error
): LanguageModelV1 {
  return {
    specificationVersion: 'v1' as const,
    modelId: id,
    provider: `provider-${id}`,
    defaultObjectGenerationMode: undefined,

    doGenerate: vi.fn().mockImplementation(async () => {
      if (shouldFail) {
        throw failureError || new Error(`Model ${id} failed`);
      }
      return {
        text: `Response from ${id}`,
        finishReason: 'stop' as LanguageModelV1FinishReason,
        usage: { promptTokens: 10, completionTokens: 20 },
        rawCall: { rawPrompt: 'test', rawSettings: {} },
      };
    }),

    doStream: vi.fn().mockImplementation(async () => {
      if (shouldFail) {
        throw failureError || new Error(`Model ${id} failed`);
      }

      // Return a mock stream that doesn't actually create a ReadableStream
      return {
        stream: {
          getReader: () => ({
            read: vi
              .fn()
              .mockResolvedValueOnce({
                done: false,
                value: { type: 'text-delta', textDelta: `Stream from ${id}` },
              })
              .mockResolvedValueOnce({
                done: false,
                value: {
                  type: 'finish',
                  finishReason: 'stop',
                  usage: { promptTokens: 10, completionTokens: 20 },
                },
              })
              .mockResolvedValueOnce({ done: true }),
            releaseLock: vi.fn(),
          }),
        } as any,
        rawCall: { rawPrompt: 'test', rawSettings: {} },
      };
    }),
  };
}

describe('FallbackModel - Memory Safe Streaming Tests', () => {
  it('should successfully stream from the first model', async () => {
    const model1 = createMemorySafeMockModel('model1');
    const model2 = createMemorySafeMockModel('model2');
    const fallback = createFallback({ models: [model1, model2] });

    const options: LanguageModelV1CallOptions = {
      inputFormat: 'prompt',
      prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
      mode: { type: 'regular' },
    };

    await fallback.doStream(options);

    expect(model1.doStream).toHaveBeenCalledWith(options);
    expect(model2.doStream).not.toHaveBeenCalled();
  });

  it('should fallback on retryable error', async () => {
    const error = Object.assign(new Error('Rate limited'), { statusCode: 429 });
    const model1 = createMemorySafeMockModel('model1', true, error);
    const model2 = createMemorySafeMockModel('model2');
    const fallback = createFallback({ models: [model1, model2] });

    const options: LanguageModelV1CallOptions = {
      inputFormat: 'prompt',
      prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
      mode: { type: 'regular' },
    };

    await fallback.doStream(options);

    expect(model1.doStream).toHaveBeenCalled();
    expect(model2.doStream).toHaveBeenCalled();
  });

  it('should call onError callback', async () => {
    const error = Object.assign(new Error('Server error'), { statusCode: 500 });
    const model1 = createMemorySafeMockModel('model1', true, error);
    const model2 = createMemorySafeMockModel('model2');
    const onError = vi.fn();

    const fallback = createFallback({
      models: [model1, model2],
      onError,
    });

    const options: LanguageModelV1CallOptions = {
      inputFormat: 'prompt',
      prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
      mode: { type: 'regular' },
    };

    await fallback.doStream(options);

    expect(onError).toHaveBeenCalledWith(error, 'model1');
  });

  it('should throw non-retryable errors', async () => {
    const error = new Error('Invalid API key');
    const model1 = createMemorySafeMockModel('model1', true, error);
    const model2 = createMemorySafeMockModel('model2');

    const fallback = createFallback({ models: [model1, model2] });

    const options: LanguageModelV1CallOptions = {
      inputFormat: 'prompt',
      prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
      mode: { type: 'regular' },
    };

    await expect(fallback.doStream(options)).rejects.toThrow('Invalid API key');
    expect(model2.doStream).not.toHaveBeenCalled();
  });
});
