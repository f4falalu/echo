import type { LanguageModelV2StreamPart } from '@ai-sdk/provider';
import { expect, test, vi } from 'vitest';
import { createFallback } from './ai-fallback.js';
import { MockLanguageModelV2 } from './test-utils/mock-model.js';

test('doStream switches models on error', async () => {
  const onError = vi.fn();

  const model1 = new MockLanguageModelV2({
    modelId: 'stream-error-model',
    doStream: async () => {
      throw new Error('Stream service unavailable');
    },
  });

  const model2 = new MockLanguageModelV2({
    modelId: 'stream-success-model',
    doStream: async () => ({
      stream: new ReadableStream<LanguageModelV2StreamPart>({
        start(controller) {
          controller.enqueue({ type: 'stream-start', warnings: [] });
          controller.enqueue({ type: 'text-delta', id: '1', delta: 'Hello from fallback' });
          controller.enqueue({
            type: 'finish',
            finishReason: 'stop',
            usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
          });
          controller.close();
        },
      }),
      rawCall: { rawPrompt: '', rawSettings: {} },
    }),
  });

  const fallback = createFallback({
    models: [model1, model2],
    onError,
  });

  const result = await fallback.doStream({
    prompt: [],
  });

  // Read the stream
  const reader = result.stream.getReader();
  const chunks: LanguageModelV2StreamPart[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  expect(chunks).toHaveLength(3);
  expect(chunks[0]!.type).toBe('stream-start');
  expect(chunks[1]).toEqual({ type: 'text-delta', id: '1', delta: 'Hello from fallback' });
  expect(chunks[2]!.type).toBe('finish');

  expect(fallback.currentModelIndex).toBe(1);
  expect(onError).toHaveBeenCalledWith(
    expect.objectContaining({ message: 'Stream service unavailable' }),
    'stream-error-model'
  );
});

test('doStream handles error during streaming', async () => {
  const onError = vi.fn();

  const model1 = new MockLanguageModelV2({
    modelId: 'partial-stream-error',
    doStream: async () => ({
      stream: new ReadableStream<LanguageModelV2StreamPart>({
        start(controller) {
          controller.error(new Error('Connection reset'));
        },
      }),
      rawCall: { rawPrompt: '', rawSettings: {} },
    }),
  });

  const model2 = new MockLanguageModelV2({
    modelId: 'fallback-model',
    doStream: async () => ({
      stream: new ReadableStream<LanguageModelV2StreamPart>({
        start(controller) {
          controller.enqueue({ type: 'stream-start', warnings: [] });
          controller.enqueue({ type: 'text-delta', id: '1', delta: 'Fallback response' });
          controller.enqueue({
            type: 'finish',
            finishReason: 'stop',
            usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
          });
          controller.close();
        },
      }),
      rawCall: { rawPrompt: '', rawSettings: {} },
    }),
  });

  const fallback = createFallback({
    models: [model1, model2],
    onError,
  });

  const result = await fallback.doStream({
    prompt: [],
  });

  // Read the stream
  const reader = result.stream.getReader();
  const chunks: LanguageModelV2StreamPart[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  expect(chunks.some((c) => c.type === 'text-delta' && c.delta === 'Fallback response')).toBe(true);
  expect(fallback.currentModelIndex).toBe(1);
});

test('doStream with partial output and retryAfterOutput=true', async () => {
  const onError = vi.fn();

  const model1 = new MockLanguageModelV2({
    modelId: 'partial-stream-model',
    doStream: async () => ({
      stream: new ReadableStream<LanguageModelV2StreamPart>({
        start(controller) {
          controller.enqueue({ type: 'stream-start', warnings: [] });
          controller.enqueue({ type: 'text-delta', id: '1', delta: 'Partial output' });
          controller.error(new Error('Stream interrupted'));
        },
      }),
      rawCall: { rawPrompt: '', rawSettings: {} },
    }),
  });

  const model2 = new MockLanguageModelV2({
    modelId: 'fallback-model',
    doStream: async () => ({
      stream: new ReadableStream<LanguageModelV2StreamPart>({
        start(controller) {
          controller.enqueue({ type: 'stream-start', warnings: [] });
          controller.enqueue({ type: 'text-delta', id: '1', delta: 'Fallback continuation' });
          controller.enqueue({
            type: 'finish',
            finishReason: 'stop',
            usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
          });
          controller.close();
        },
      }),
      rawCall: { rawPrompt: '', rawSettings: {} },
    }),
  });

  const fallback = createFallback({
    models: [model1, model2],
    retryAfterOutput: true, // Explicitly allow retry after output
    onError,
  });

  const result = await fallback.doStream({
    prompt: [],
  });

  // Read the stream
  const reader = result.stream.getReader();
  const chunks: LanguageModelV2StreamPart[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  // When retryAfterOutput is true, it should retry but only show fallback output
  // The partial output from the failed model is lost
  const textChunks = chunks.filter((c) => c.type === 'text-delta');
  expect(textChunks).toHaveLength(1);
  expect(textChunks[0]!.delta).toBe('Fallback continuation');

  // Should switch models after error
  expect(fallback.currentModelIndex).toBe(1);
  expect(onError).toHaveBeenCalledWith(
    expect.objectContaining({ message: 'Stream interrupted' }),
    'partial-stream-model'
  );
});

test('doStream handles error in stream part', async () => {
  const encounteredErrors: any[] = [];

  const model1 = new MockLanguageModelV2({
    modelId: 'error-part-model',
    doStream: async () => ({
      stream: new ReadableStream<LanguageModelV2StreamPart>({
        start(controller) {
          controller.enqueue({ type: 'stream-start', warnings: [] });
          controller.enqueue({ type: 'error' as any, error: 'Overloaded' });
          controller.close();
        },
      }),
      rawCall: { rawPrompt: '', rawSettings: {} },
    }),
  });

  const model2 = new MockLanguageModelV2({
    modelId: 'success-model',
    doStream: async () => ({
      stream: new ReadableStream<LanguageModelV2StreamPart>({
        start(controller) {
          controller.enqueue({ type: 'stream-start', warnings: [] });
          controller.enqueue({ type: 'text-delta', id: '1', delta: 'Success' });
          controller.enqueue({
            type: 'finish',
            finishReason: 'stop',
            usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
          });
          controller.close();
        },
      }),
      rawCall: { rawPrompt: '', rawSettings: {} },
    }),
  });

  const fallback = createFallback({
    models: [model1, model2],
    shouldRetryThisError: (error) => {
      encounteredErrors.push(error);
      return true;
    },
  });

  const result = await fallback.doStream({
    prompt: [],
  });

  // Read the stream
  const reader = result.stream.getReader();
  const chunks: LanguageModelV2StreamPart[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  // Should have switched to model 2 and gotten success
  expect(chunks.some((c) => c.type === 'text-delta' && c.delta === 'Success')).toBe(true);
  expect(encounteredErrors).toHaveLength(1);
  expect(encounteredErrors[0]).toBe('Overloaded');
  expect(fallback.currentModelIndex).toBe(1);
});

test('doGenerate switches models on error', async () => {
  const model1 = new MockLanguageModelV2({
    modelId: 'failing-model',
    doGenerate: async () => {
      const error = new Error('Service temporarily unavailable');
      (error as any).statusCode = 503;
      throw error;
    },
  });

  const model2 = new MockLanguageModelV2({
    modelId: 'working-model',
    doGenerate: async () => ({
      content: [{ type: 'text', text: 'Response from fallback model' }],
      finishReason: 'stop' as const,
      usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
      warnings: [],
    }),
  });

  const fallback = createFallback({
    models: [model1, model2],
  });

  expect(fallback.currentModelIndex).toBe(0);
  expect(fallback.modelId).toBe('failing-model');

  const result = await fallback.doGenerate({
    prompt: [],
  });

  expect(result.content[0]).toEqual({ type: 'text', text: 'Response from fallback model' });
  expect(fallback.currentModelIndex).toBe(1);
  expect(fallback.modelId).toBe('working-model');
});

test('cycles through all models until one works', async () => {
  const model1 = new MockLanguageModelV2({
    modelId: 'model-1',
    doGenerate: async () => {
      const error = new Error('Rate limit exceeded');
      (error as any).statusCode = 429;
      throw error;
    },
  });

  const model2 = new MockLanguageModelV2({
    modelId: 'model-2',
    doGenerate: async () => {
      const error = new Error('Internal server error');
      (error as any).statusCode = 500;
      throw error;
    },
  });

  const model3 = new MockLanguageModelV2({
    modelId: 'model-3',
    doGenerate: async () => ({
      content: [{ type: 'text', text: 'Success from model 3' }],
      finishReason: 'stop' as const,
      usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
      warnings: [],
    }),
  });

  const fallback = createFallback({
    models: [model1, model2, model3],
  });

  const result = await fallback.doGenerate({
    prompt: [],
  });

  expect(result.content[0]).toEqual({ type: 'text', text: 'Success from model 3' });
  expect(fallback.currentModelIndex).toBe(2);
  expect(fallback.modelId).toBe('model-3');
});

test('throws error when all models fail', async () => {
  const model1 = new MockLanguageModelV2({
    modelId: 'model-1',
    doGenerate: async () => {
      throw new Error('Model 1 overloaded');
    },
  });

  const model2 = new MockLanguageModelV2({
    modelId: 'model-2',
    doGenerate: async () => {
      throw new Error('Model 2 capacity reached');
    },
  });

  const fallback = createFallback({
    models: [model1, model2],
  });

  await expect(
    fallback.doGenerate({
      prompt: [],
    })
  ).rejects.toThrow('Model 2 capacity reached');

  // Should cycle back to initial model after trying all
  expect(fallback.currentModelIndex).toBe(0);
});

test('model reset interval resets to first model', async () => {
  vi.useFakeTimers();

  const model1 = new MockLanguageModelV2({ modelId: 'primary-model' });
  const model2 = new MockLanguageModelV2({ modelId: 'fallback-model' });

  const fallback = createFallback({
    models: [model1, model2],
    modelResetInterval: 60000, // 1 minute
  });

  // Force switch to model 2
  fallback.currentModelIndex = 1;
  expect(fallback.modelId).toBe('fallback-model');

  // Advance time past reset interval
  vi.advanceTimersByTime(61000);

  // Trigger reset check
  await fallback.doGenerate({
    prompt: [],
  });

  expect(fallback.currentModelIndex).toBe(0);
  expect(fallback.modelId).toBe('primary-model');

  vi.useRealTimers();
});

test('shouldRetryThisError callback controls retry behavior', async () => {
  const shouldRetryThisError = vi.fn((error: Error) => {
    // Only retry if message contains 'retry-this'
    return error.message.includes('retry-this');
  });

  const model1 = new MockLanguageModelV2({
    modelId: 'model-1',
    doGenerate: async () => {
      throw new Error('specific-error-that-should-not-retry');
    },
  });

  const model2 = new MockLanguageModelV2({
    modelId: 'model-2',
    doGenerate: async () => ({
      content: [{ type: 'text', text: 'Should not reach here' }],
      finishReason: 'stop' as const,
      usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
      warnings: [],
    }),
  });

  const fallback = createFallback({
    models: [model1, model2],
    shouldRetryThisError,
  });

  // Should not retry because error doesn't match
  await expect(
    fallback.doGenerate({
      prompt: [],
    })
  ).rejects.toThrow('specific-error-that-should-not-retry');

  expect(shouldRetryThisError).toHaveBeenCalledWith(
    expect.objectContaining({ message: 'specific-error-that-should-not-retry' })
  );
  expect(fallback.currentModelIndex).toBe(0); // Should not switch
});

test('handles non-existent model error', async () => {
  const onError = vi.fn();

  const model1 = new MockLanguageModelV2({
    modelId: 'non-existent-model',
    doGenerate: async () => {
      const error = new Error('Model does not exist');
      (error as any).statusCode = 404;
      throw error;
    },
  });

  const model2 = new MockLanguageModelV2({
    modelId: 'valid-model',
    doGenerate: async () => ({
      content: [{ type: 'text', text: 'Fallback response' }],
      finishReason: 'stop' as const,
      usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
      warnings: [],
    }),
  });

  const fallback = createFallback({
    models: [model1, model2],
    shouldRetryThisError: (error) => {
      const message = error.message.toLowerCase();
      return message.includes('does not exist') || message.includes('model_not_found');
    },
    onError,
  });

  const result = await fallback.doGenerate({
    prompt: [],
  });

  expect(result.content[0]).toEqual({ type: 'text', text: 'Fallback response' });
  expect(fallback.currentModelIndex).toBe(1);
  expect(onError).toHaveBeenCalledWith(
    expect.objectContaining({ message: 'Model does not exist' }),
    'non-existent-model'
  );
});

test('handles API key errors', async () => {
  const model1 = new MockLanguageModelV2({
    modelId: 'model-with-wrong-key',
    doGenerate: async () => {
      const error = new Error('Invalid API key');
      (error as any).statusCode = 401;
      throw error;
    },
  });

  const model2 = new MockLanguageModelV2({
    modelId: 'model-with-correct-key',
    doGenerate: async () => ({
      content: [{ type: 'text', text: 'Success with correct key' }],
      finishReason: 'stop' as const,
      usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
      warnings: [],
    }),
  });

  const fallback = createFallback({
    models: [model1, model2],
  });

  const result = await fallback.doGenerate({
    prompt: [],
  });

  expect(result.content[0]).toEqual({ type: 'text', text: 'Success with correct key' });
  expect(fallback.currentModelIndex).toBe(1);
});

test('handles rate limit errors', async () => {
  let attempts = 0;

  const model1 = new MockLanguageModelV2({
    modelId: 'rate-limited-model',
    doGenerate: async () => {
      attempts++;
      const error = new Error('Rate limit exceeded');
      (error as any).statusCode = 429;
      throw error;
    },
  });

  const model2 = new MockLanguageModelV2({
    modelId: 'available-model',
    doGenerate: async () => ({
      content: [{ type: 'text', text: 'Response from available model' }],
      finishReason: 'stop' as const,
      usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
      warnings: [],
    }),
  });

  const fallback = createFallback({
    models: [model1, model2],
  });

  const result = await fallback.doGenerate({
    prompt: [],
  });

  // With retry-before-switch, model1 will be tried twice (default maxRetriesPerModel is 2)
  expect(attempts).toBe(2);
  expect(result.content[0]).toEqual({ type: 'text', text: 'Response from available model' });
  expect(fallback.currentModelIndex).toBe(1);
});

test('FallbackModel basic functionality', () => {
  const model1 = new MockLanguageModelV2({ modelId: 'model-1', provider: 'provider-1' });
  const model2 = new MockLanguageModelV2({ modelId: 'model-2', provider: 'provider-2' });

  const fallback = createFallback({
    models: [model1, model2],
  });

  // Test initial state
  expect(fallback.modelId).toBe('model-1');
  expect(fallback.provider).toBe('provider-1');
  expect(fallback.specificationVersion).toBe('v2');
  expect(fallback.supportedUrls).toEqual({});

  // Test switching models
  fallback.currentModelIndex = 1;
  expect(fallback.modelId).toBe('model-2');
  expect(fallback.provider).toBe('provider-2');
});

test('constructor throws error when no models provided', () => {
  expect(() => {
    createFallback({ models: [] });
  }).toThrow('No models available in settings');
});

test('retries same model before switching on network error', async () => {
  let model1Attempts = 0;
  let model2Attempts = 0;

  const model1 = new MockLanguageModelV2({
    modelId: 'model-1',
    doGenerate: async () => {
      model1Attempts++;
      if (model1Attempts <= 2) {
        const error = new Error('Service temporarily unavailable');
        (error as any).statusCode = 503;
        throw error;
      }
      return {
        content: [{ type: 'text', text: 'Success from model 1' }],
        finishReason: 'stop' as const,
        usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
        warnings: [],
      };
    },
  });

  const model2 = new MockLanguageModelV2({
    modelId: 'model-2',
    doGenerate: async () => {
      model2Attempts++;
      return {
        content: [{ type: 'text', text: 'Success from model 2' }],
        finishReason: 'stop' as const,
        usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
        warnings: [],
      };
    },
  });

  const fallback = createFallback({
    models: [model1, model2],
    maxRetriesPerModel: 3,
  });

  const result = await fallback.doGenerate({
    prompt: [],
  });

  // Should retry model 1 three times, then succeed on the third attempt
  expect(model1Attempts).toBe(3);
  expect(model2Attempts).toBe(0); // Should not reach model 2
  expect(result.content[0]).toEqual({ type: 'text', text: 'Success from model 1' });
  expect(fallback.currentModelIndex).toBe(0); // Still on model 1
});

test('switches to next model after exhausting retries', async () => {
  let model1Attempts = 0;
  const onError = vi.fn();

  const model1 = new MockLanguageModelV2({
    modelId: 'model-1',
    doGenerate: async () => {
      model1Attempts++;
      const error = new Error('Rate limit exceeded');
      (error as any).statusCode = 429;
      throw error;
    },
  });

  const model2 = new MockLanguageModelV2({
    modelId: 'model-2',
    doGenerate: async () => ({
      content: [{ type: 'text', text: 'Success from model 2' }],
      finishReason: 'stop' as const,
      usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
      warnings: [],
    }),
  });

  const fallback = createFallback({
    models: [model1, model2],
    maxRetriesPerModel: 2,
    onError,
  });

  const result = await fallback.doGenerate({
    prompt: [],
  });

  // Should try model 1 twice, then switch to model 2
  expect(model1Attempts).toBe(2);
  expect(result.content[0]).toEqual({ type: 'text', text: 'Success from model 2' });
  expect(fallback.currentModelIndex).toBe(1);
  expect(onError).toHaveBeenCalledTimes(2);
});

test('applies exponential backoff between retries', async () => {
  let model1Attempts = 0;
  const timestamps: number[] = [];

  const model1 = new MockLanguageModelV2({
    modelId: 'model-1',
    doGenerate: async () => {
      model1Attempts++;
      timestamps.push(Date.now());
      if (model1Attempts < 3) {
        const error = new Error('Server error');
        (error as any).statusCode = 500;
        throw error;
      }
      return {
        content: [{ type: 'text', text: 'Success' }],
        finishReason: 'stop' as const,
        usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
        warnings: [],
      };
    },
  });

  const fallback = createFallback({
    models: [model1],
    maxRetriesPerModel: 3,
  });

  const start = Date.now();
  await fallback.doGenerate({
    prompt: [],
  });

  expect(model1Attempts).toBe(3);

  // Check that delays increase (exponential backoff)
  if (timestamps.length >= 3) {
    const delay1 = timestamps[1]! - timestamps[0]!;
    const delay2 = timestamps[2]! - timestamps[1]!;

    // Second delay should be roughly double the first (allowing for some variance)
    expect(delay2).toBeGreaterThanOrEqual(delay1 * 1.5);
  }
});

test('respects maxRetriesPerModel setting', async () => {
  let model1Attempts = 0;

  const model1 = new MockLanguageModelV2({
    modelId: 'model-1',
    doGenerate: async () => {
      model1Attempts++;
      const error = new Error('Timeout');
      throw error;
    },
  });

  const model2 = new MockLanguageModelV2({
    modelId: 'model-2',
    doGenerate: async () => ({
      content: [{ type: 'text', text: 'Model 2 response' }],
      finishReason: 'stop' as const,
      usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
      warnings: [],
    }),
  });

  const fallback = createFallback({
    models: [model1, model2],
    maxRetriesPerModel: 5,
  });

  const result = await fallback.doGenerate({
    prompt: [],
  });

  expect(model1Attempts).toBe(5); // Should retry exactly 5 times
  expect(result.content[0]).toEqual({ type: 'text', text: 'Model 2 response' });
});

test('does not retry non-retryable errors', async () => {
  let model1Attempts = 0;
  const onError = vi.fn();

  const model1 = new MockLanguageModelV2({
    modelId: 'model-1',
    doGenerate: async () => {
      model1Attempts++;
      throw new Error('Invalid request format');
    },
  });

  const model2 = new MockLanguageModelV2({
    modelId: 'model-2',
    doGenerate: async () => ({
      content: [{ type: 'text', text: 'Should not reach here' }],
      finishReason: 'stop' as const,
      usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
      warnings: [],
    }),
  });

  const fallback = createFallback({
    models: [model1, model2],
    maxRetriesPerModel: 3,
    shouldRetryThisError: (error) => {
      // Only retry server errors
      return (error as any).statusCode >= 500;
    },
    onError,
  });

  await expect(
    fallback.doGenerate({
      prompt: [],
    })
  ).rejects.toThrow('Invalid request format');

  expect(model1Attempts).toBe(1); // Should not retry
  expect(onError).not.toHaveBeenCalled();
});

test('prevents infinite recursion when all models fail in doStream', async () => {
  const model1 = new MockLanguageModelV2({
    modelId: 'stream-fail-1',
    doStream: async () => ({
      stream: new ReadableStream<LanguageModelV2StreamPart>({
        start(controller) {
          controller.error(new Error('Model 1 connection failed'));
        },
      }),
      rawCall: { rawPrompt: '', rawSettings: {} },
    }),
  });

  const model2 = new MockLanguageModelV2({
    modelId: 'stream-fail-2',
    doStream: async () => ({
      stream: new ReadableStream<LanguageModelV2StreamPart>({
        start(controller) {
          controller.error(new Error('Model 2 connection failed'));
        },
      }),
      rawCall: { rawPrompt: '', rawSettings: {} },
    }),
  });

  const fallback = createFallback({
    models: [model1, model2],
    retryAfterOutput: true,
  });

  const result = await fallback.doStream({
    prompt: [],
  });

  const reader = result.stream.getReader();

  // Should error out after trying both models, not infinite loop
  await expect(
    (async () => {
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }
    })()
  ).rejects.toThrow();

  // Should be on model 2 after trying both
  expect(fallback.currentModelIndex).toBe(1);
});

test('onError callback failure does not break retry logic', async () => {
  let model1Attempts = 0;
  let model2Called = false;
  const onErrorCalls: string[] = [];

  const model1 = new MockLanguageModelV2({
    modelId: 'model-1',
    doGenerate: async () => {
      model1Attempts++;
      const error = new Error('Service unavailable');
      (error as any).statusCode = 503;
      throw error;
    },
  });

  const model2 = new MockLanguageModelV2({
    modelId: 'model-2',
    doGenerate: async () => {
      model2Called = true;
      return {
        content: [{ type: 'text', text: 'Success from model 2' }],
        finishReason: 'stop' as const,
        usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
        warnings: [],
      };
    },
  });

  const fallback = createFallback({
    models: [model1, model2],
    maxRetriesPerModel: 2,
    onError: async (error, modelId) => {
      onErrorCalls.push(modelId);
      // This throws an error - should not break retry logic
      throw new Error('onError callback failed!');
    },
  });

  const result = await fallback.doGenerate({
    prompt: [],
  });

  // Should still retry and switch models despite onError throwing
  expect(model1Attempts).toBe(2);
  expect(model2Called).toBe(true);
  expect(result.content[0]).toEqual({ type: 'text', text: 'Success from model 2' });
  expect(onErrorCalls).toEqual(['model-1', 'model-1']); // Called twice for model-1
});

test('retries network errors in doStream', async () => {
  let model1Attempts = 0;

  const model1 = new MockLanguageModelV2({
    modelId: 'stream-model-1',
    doStream: async () => {
      model1Attempts++;
      if (model1Attempts < 2) {
        const error = new Error('Gateway timeout');
        (error as any).statusCode = 504;
        throw error;
      }
      return {
        stream: new ReadableStream<LanguageModelV2StreamPart>({
          start(controller) {
            controller.enqueue({ type: 'stream-start', warnings: [] });
            controller.enqueue({ type: 'text-delta', id: '1', delta: 'Retry succeeded' });
            controller.enqueue({
              type: 'finish',
              finishReason: 'stop',
              usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
            });
            controller.close();
          },
        }),
        rawCall: { rawPrompt: '', rawSettings: {} },
      };
    },
  });

  const fallback = createFallback({
    models: [model1],
    maxRetriesPerModel: 2,
  });

  const result = await fallback.doStream({
    prompt: [],
  });

  const reader = result.stream.getReader();
  const chunks: LanguageModelV2StreamPart[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  expect(model1Attempts).toBe(2);
  expect(chunks.some((c) => c.type === 'text-delta' && c.delta === 'Retry succeeded')).toBe(true);
});
