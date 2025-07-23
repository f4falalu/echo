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

// Memory-safe mock that simulates AbortError during streaming
function createAbortingMemorySafeMockModel(id: string, abortAfterChunks = 1): LanguageModelV1 {
  return {
    specificationVersion: 'v1' as const,
    modelId: id,
    provider: `provider-${id}`,
    defaultObjectGenerationMode: undefined,

    doGenerate: vi.fn(),

    doStream: vi.fn().mockImplementation(async () => {
      let readCount = 0;

      return {
        stream: {
          getReader: () => ({
            read: vi.fn().mockImplementation(async () => {
              if (readCount < abortAfterChunks) {
                readCount++;
                return {
                  done: false,
                  value: {
                    type: 'text-delta',
                    textDelta: `Stream chunk ${readCount} from ${id}`,
                  } as LanguageModelV1StreamPart,
                };
              }
              // Throw AbortError after specified chunks
              const abortError = new Error('The operation was aborted');
              abortError.name = 'AbortError';
              throw abortError;
            }),
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

  describe('AbortError handling', () => {
    it('should handle AbortError without retrying to next model', async () => {
      const model1 = createAbortingMemorySafeMockModel('model1', 1); // Aborts after first chunk
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

      const result = await fallback.doStream(options);
      const reader = result.stream.getReader();

      // Read first chunk successfully
      const firstChunk = await reader.read();
      expect(firstChunk.done).toBe(false);
      expect(firstChunk.value).toEqual({
        type: 'text-delta',
        textDelta: 'Stream chunk 1 from model1',
      });

      // Next read should complete without error (AbortError is handled gracefully)
      const secondRead = await reader.read();
      expect(secondRead.done).toBe(true);

      // Should not have called onError since AbortError is intentional
      expect(onError).not.toHaveBeenCalled();

      // Should not have tried the second model
      expect(model2.doStream).not.toHaveBeenCalled();
    });

    it('should handle AbortError before any output', async () => {
      const model1 = createAbortingMemorySafeMockModel('model1', 0); // Aborts immediately
      const model2 = createMemorySafeMockModel('model2');

      const fallback = createFallback({ models: [model1, model2] });

      const options: LanguageModelV1CallOptions = {
        inputFormat: 'prompt',
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
        mode: { type: 'regular' },
      };

      const result = await fallback.doStream(options);
      const reader = result.stream.getReader();

      // First read should complete without error
      const firstRead = await reader.read();
      expect(firstRead.done).toBe(true);

      // Should not have tried the second model (abort is intentional)
      expect(model2.doStream).not.toHaveBeenCalled();
    });

    it('should not retry on AbortError even with retryAfterOutput enabled', async () => {
      const model1 = createAbortingMemorySafeMockModel('model1', 2); // Aborts after 2 chunks
      const model2 = createMemorySafeMockModel('model2');

      const fallback = createFallback({
        models: [model1, model2],
        retryAfterOutput: true, // Even with this enabled, AbortError should not retry
      });

      const options: LanguageModelV1CallOptions = {
        inputFormat: 'prompt',
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
        mode: { type: 'regular' },
      };

      const result = await fallback.doStream(options);
      const reader = result.stream.getReader();

      // Read chunks successfully
      const chunk1 = await reader.read();
      expect(chunk1.value).toEqual({
        type: 'text-delta',
        textDelta: 'Stream chunk 1 from model1',
      });

      const chunk2 = await reader.read();
      expect(chunk2.value).toEqual({
        type: 'text-delta',
        textDelta: 'Stream chunk 2 from model1',
      });

      // Next read should complete without error
      const finalRead = await reader.read();
      expect(finalRead.done).toBe(true);

      // Should not have tried model2 even with retryAfterOutput
      expect(model2.doStream).not.toHaveBeenCalled();
    });

    it('should not cause "Controller is already closed" error on AbortError', async () => {
      // This test specifically validates the fix for the controller closed issue
      const model1 = createAbortingMemorySafeMockModel('model1', 1);
      const model2 = createMemorySafeMockModel('model2');

      const fallback = createFallback({
        models: [model1, model2],
        retryAfterOutput: true,
      });

      const options: LanguageModelV1CallOptions = {
        inputFormat: 'prompt',
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
        mode: { type: 'regular' },
      };

      // This should not throw "Controller is already closed" error
      const result = await fallback.doStream(options);
      const reader = result.stream.getReader();

      let errorThrown: Error | null = null;
      const chunks: any[] = [];

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
      } catch (error) {
        errorThrown = error as Error;
      }

      // Should have successfully read one chunk before abort
      expect(chunks).toHaveLength(1);

      // Should not have thrown any error
      expect(errorThrown).toBeNull();

      // Should not have tried to fallback to model2
      expect(model2.doStream).not.toHaveBeenCalled();
    });
  });
});
