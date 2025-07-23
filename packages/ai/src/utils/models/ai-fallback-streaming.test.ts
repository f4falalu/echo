import type {
  LanguageModelV1,
  LanguageModelV1CallOptions,
  LanguageModelV1FinishReason,
  LanguageModelV1StreamPart,
} from '@ai-sdk/provider';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFallback } from './ai-fallback';

// Mock model factory - using synchronous operations to avoid memory issues
function createMockModel(id: string, shouldFail = false, failureError?: Error): LanguageModelV1 {
  const mockModel: LanguageModelV1 = {
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

      const chunks: LanguageModelV1StreamPart[] = [
        { type: 'text-delta', textDelta: `Stream from ${id}` },
        { type: 'finish', finishReason: 'stop', usage: { promptTokens: 10, completionTokens: 20 } },
      ];

      const stream = new ReadableStream<LanguageModelV1StreamPart>({
        start(controller) {
          // Enqueue all chunks synchronously to avoid async complexity
          chunks.forEach((chunk) => controller.enqueue(chunk));
          controller.close();
        },
      });

      return {
        stream,
        rawCall: { rawPrompt: 'test', rawSettings: {} },
      };
    }),
  };

  return mockModel;
}

// Helper to create a failing stream that errors mid-stream
function createFailingStreamModel(id: string, errorAfterChunks = 1): LanguageModelV1 {
  const mockModel: LanguageModelV1 = {
    specificationVersion: 'v1' as const,
    modelId: id,
    provider: `provider-${id}`,
    defaultObjectGenerationMode: undefined,

    doGenerate: vi.fn(),

    doStream: vi.fn().mockImplementation(async () => {
      const chunks: LanguageModelV1StreamPart[] = [
        { type: 'text-delta', textDelta: `Partial stream from ${id}` },
        { type: 'text-delta', textDelta: ' more text' },
        { type: 'finish', finishReason: 'stop', usage: { promptTokens: 10, completionTokens: 20 } },
      ];

      const stream = new ReadableStream<LanguageModelV1StreamPart>({
        start(controller) {
          let chunkCount = 0;
          // Enqueue chunks up to the error point synchronously
          for (const chunk of chunks) {
            if (chunkCount >= errorAfterChunks) {
              // Use setTimeout to error asynchronously after chunks are enqueued
              setTimeout(() => controller.error(new Error(`Stream error in ${id}`)), 0);
              return;
            }
            controller.enqueue(chunk);
            chunkCount++;
          }
          controller.close();
        },
      });

      return {
        stream,
        rawCall: { rawPrompt: 'test', rawSettings: {} },
      };
    }),
  };

  return mockModel;
}

// Helper to create a model that throws AbortError during streaming
function createAbortingStreamModel(id: string, abortAfterChunks = 1): LanguageModelV1 {
  const mockModel: LanguageModelV1 = {
    specificationVersion: 'v1' as const,
    modelId: id,
    provider: `provider-${id}`,
    defaultObjectGenerationMode: undefined,

    doGenerate: vi.fn(),

    doStream: vi.fn().mockImplementation(async () => {
      const chunks: LanguageModelV1StreamPart[] = [
        { type: 'text-delta', textDelta: `Stream from ${id} before abort` },
        { type: 'text-delta', textDelta: ' more text' },
        { type: 'finish', finishReason: 'stop', usage: { promptTokens: 10, completionTokens: 20 } },
      ];

      const stream = new ReadableStream<LanguageModelV1StreamPart>({
        start(controller) {
          let chunkCount = 0;
          // Enqueue chunks up to the abort point
          for (const chunk of chunks) {
            if (chunkCount >= abortAfterChunks) {
              // Simulate an AbortError
              const abortError = new Error('The operation was aborted');
              abortError.name = 'AbortError';
              setTimeout(() => controller.error(abortError), 0);
              return;
            }
            controller.enqueue(chunk);
            chunkCount++;
          }
          controller.close();
        },
      });

      return {
        stream,
        rawCall: { rawPrompt: 'test', rawSettings: {} },
      };
    }),
  };

  return mockModel;
}

// NOTE: These streaming tests are temporarily disabled due to memory issues
// with ReadableStream in the test environment. See ai-fallback-memory-safe.test.ts
// for alternative streaming tests that avoid memory issues.
describe.skip('FallbackModel - Streaming', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('doStream', () => {
    it('should successfully stream from the first model', async () => {
      const model1 = createMockModel('model1');
      const model2 = createMockModel('model2');
      const fallback = createFallback({ models: [model1, model2] });

      const options: LanguageModelV1CallOptions = {
        inputFormat: 'prompt',
        prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
        mode: { type: 'regular' },
      };

      const result = await fallback.doStream(options);
      const reader = result.stream.getReader();
      const chunks: LanguageModelV1StreamPart[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      expect(model1.doStream).toHaveBeenCalledWith(options);
      expect(model2.doStream).not.toHaveBeenCalled();
      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toEqual({ type: 'text-delta', textDelta: 'Stream from model1' });
    });

    describe('streaming error handling', () => {
      it('should fallback if stream fails before any output', async () => {
        const model1 = createFailingStreamModel('model1', 0); // Fails immediately
        const model2 = createMockModel('model2');
        const fallback = createFallback({ models: [model1, model2] });

        const options: LanguageModelV1CallOptions = {
          inputFormat: 'prompt',
          prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
          mode: { type: 'regular' },
        };

        const result = await fallback.doStream(options);
        const reader = result.stream.getReader();
        const chunks: LanguageModelV1StreamPart[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }

        expect(chunks).toHaveLength(2);
        expect(chunks[0]).toEqual({ type: 'text-delta', textDelta: 'Stream from model2' });
      });

      it('should not fallback if stream fails after output (default behavior)', async () => {
        const model1 = createFailingStreamModel('model1', 1); // Fails after first chunk
        const model2 = createMockModel('model2');
        const fallback = createFallback({ models: [model1, model2] });

        const options: LanguageModelV1CallOptions = {
          inputFormat: 'prompt',
          prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
          mode: { type: 'regular' },
        };

        const result = await fallback.doStream(options);
        const reader = result.stream.getReader();
        const chunks: LanguageModelV1StreamPart[] = [];

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
        } catch (error) {
          expect(error).toMatchObject({ message: 'Stream error in model1' });
        }

        expect(chunks).toHaveLength(1);
        expect(chunks[0]).toEqual({ type: 'text-delta', textDelta: 'Partial stream from model1' });
        expect(model2.doStream).not.toHaveBeenCalled();
      });

      it('should fallback even after output if retryAfterOutput is true', async () => {
        const model1 = createFailingStreamModel('model1', 1); // Fails after first chunk
        const model2 = createMockModel('model2');
        const fallback = createFallback({
          models: [model1, model2],
          retryAfterOutput: true,
        });

        const options: LanguageModelV1CallOptions = {
          inputFormat: 'prompt',
          prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
          mode: { type: 'regular' },
        };

        const result = await fallback.doStream(options);
        const reader = result.stream.getReader();
        const chunks: LanguageModelV1StreamPart[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }

        // Should have chunks from both models
        expect(chunks).toHaveLength(3); // 1 from model1, 2 from model2
        expect(chunks[0]).toEqual({ type: 'text-delta', textDelta: 'Partial stream from model1' });
        expect(chunks[1]).toEqual({ type: 'text-delta', textDelta: 'Stream from model2' });
        expect(model2.doStream).toHaveBeenCalled();
      });

      it('should handle onError callback in streaming', async () => {
        const model1 = createFailingStreamModel('model1', 0);
        const model2 = createMockModel('model2');
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
        const chunks: LanguageModelV1StreamPart[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }

        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({ message: 'Stream error in model1' }),
          'model1'
        );
      });

      it('should handle errors in fallback stream', async () => {
        const model1 = createFailingStreamModel('model1', 0);
        const model2 = createFailingStreamModel('model2', 0);
        const fallback = createFallback({ models: [model1, model2] });

        const options: LanguageModelV1CallOptions = {
          inputFormat: 'prompt',
          prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
          mode: { type: 'regular' },
        };

        const result = await fallback.doStream(options);
        const reader = result.stream.getReader();

        await expect(async () => {
          while (true) {
            const { done } = await reader.read();
            if (done) break;
          }
        }).rejects.toThrow('Stream error in model2');
      });
    });

    describe('abort error handling', () => {
      it('should handle AbortError without retrying or causing controller closed error', async () => {
        const model1 = createAbortingStreamModel('model1', 1); // Aborts after first chunk
        const model2 = createMockModel('model2');
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
        const chunks: LanguageModelV1StreamPart[] = [];
        let errorThrown: Error | null = null;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
        } catch (error) {
          errorThrown = error as Error;
        }

        // Should have received the chunk before the abort
        expect(chunks).toHaveLength(1);
        expect(chunks[0]).toEqual({
          type: 'text-delta',
          textDelta: 'Stream from model1 before abort',
        });

        // Should not have called onError since AbortError is intentional
        expect(onError).not.toHaveBeenCalled();

        // Should not have tried the second model
        expect(model2.doStream).not.toHaveBeenCalled();

        // Stream should have ended cleanly without throwing
        expect(errorThrown).toBeNull();
      });

      it('should handle AbortError before any output', async () => {
        const model1 = createAbortingStreamModel('model1', 0); // Aborts immediately
        const model2 = createMockModel('model2');
        const fallback = createFallback({ models: [model1, model2] });

        const options: LanguageModelV1CallOptions = {
          inputFormat: 'prompt',
          prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
          mode: { type: 'regular' },
        };

        const result = await fallback.doStream(options);
        const reader = result.stream.getReader();
        const chunks: LanguageModelV1StreamPart[] = [];
        let errorThrown: Error | null = null;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
        } catch (error) {
          errorThrown = error as Error;
        }

        // Should not have received any chunks
        expect(chunks).toHaveLength(0);

        // Should not have tried the second model (abort is intentional)
        expect(model2.doStream).not.toHaveBeenCalled();

        // Stream should have ended cleanly without throwing
        expect(errorThrown).toBeNull();
      });

      it('should handle AbortError with retryAfterOutput enabled', async () => {
        const model1 = createAbortingStreamModel('model1', 1); // Aborts after first chunk
        const model2 = createMockModel('model2');
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
        const chunks: LanguageModelV1StreamPart[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }

        // Should only have chunks from model1 before abort
        expect(chunks).toHaveLength(1);
        expect(chunks[0]).toEqual({
          type: 'text-delta',
          textDelta: 'Stream from model1 before abort',
        });

        // Should not have tried model2 even with retryAfterOutput
        expect(model2.doStream).not.toHaveBeenCalled();
      });
    });

    describe('stream retry with status codes', () => {
      it('should retry streaming on retryable status code', async () => {
        const error = Object.assign(new Error('Rate limited'), { statusCode: 429 });
        const model1 = createMockModel('model1', true, error);
        const model2 = createMockModel('model2');
        const fallback = createFallback({ models: [model1, model2] });

        const options: LanguageModelV1CallOptions = {
          inputFormat: 'prompt',
          prompt: [{ role: 'user', content: [{ type: 'text', text: 'Test prompt' }] }],
          mode: { type: 'regular' },
        };

        const result = await fallback.doStream(options);
        const reader = result.stream.getReader();
        const chunks: LanguageModelV1StreamPart[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }

        expect(model1.doStream).toHaveBeenCalled();
        expect(model2.doStream).toHaveBeenCalled();
        expect(chunks[0]).toEqual({ type: 'text-delta', textDelta: 'Stream from model2' });
      });
    });
  });
});
