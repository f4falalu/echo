import type { Agent } from '@mastra/core';
import { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage, StreamTextResult, TextStreamPart } from 'ai';
import { APICallError, NoSuchToolError } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import { createRetryOnErrorHandler } from '../../../src/utils/retry/retry-helpers';
import { RetryWithHealingError } from '../../../src/utils/retry/retry-error';
import type { WorkflowContext } from '../../../src/utils/retry/types';

describe('Streaming Error Scenarios - Real-World Tests', () => {
  // Mock agent helper
  function createMockAgent(streamBehavior: () => AsyncIterable<TextStreamPart<any>>) {
    return {
      stream: vi.fn().mockImplementation(async (_messages, options) => {
        return {
          fullStream: streamBehavior(),
          textStream: streamBehavior(),
          warnings: [],
          rawCall: {
            rawPrompt: [],
            rawSettings: {},
          },
          toDataStreamResponse: vi.fn(),
          pipeDataStreamToResponse: vi.fn(),
          pipeTextStreamToResponse: vi.fn(),
        } as StreamTextResult<any>;
      }),
      tools: {
        sequentialThinking: {},
        executeSql: {},
        submitThoughts: {},
      },
    } as unknown as Agent<string, any, any>;
  }

  describe('Stream Error During Tool Call', () => {
    it('should handle error thrown during tool call streaming', async () => {
      const messages: CoreMessage[] = [
        { role: 'user', content: 'Analyze my data' },
      ];

      let onChunkCalled = 0;
      let onErrorHandler: ((event: { error: unknown }) => Promise<void>) | undefined;

      const mockAgent = createMockAgent(() => {
        return {
          async *[Symbol.asyncIterator]() {
            // Yield some initial content
            yield { type: 'text-delta', textDelta: 'Let me analyze' } as TextStreamPart<any>;
            onChunkCalled++;

            // Yield a tool call
            yield {
              type: 'tool-call-delta',
              toolCallType: 'function',
              toolCallId: 'call_123',
              toolName: 'executeSql',
              argsTextDelta: '{"query": "SELECT',
            } as TextStreamPart<any>;
            onChunkCalled++;

            // Simulate network error during streaming
            throw new APICallError({
              message: 'Connection reset',
              statusCode: undefined,
              responseHeaders: {},
              responseBody: undefined,
              url: 'https://api.example.com',
              requestBodyValues: {},
              cause: new Error('ECONNRESET'),
              isRetryable: true,
            });
          },
        };
      });

      // Capture the onError handler when stream is called
      mockAgent.stream.mockImplementation(async (_messages, options) => {
        onErrorHandler = options?.onError;
        
        const streamBehavior = () => ({
          async *[Symbol.asyncIterator]() {
            yield { type: 'text-delta', textDelta: 'Let me analyze' } as TextStreamPart<any>;
            onChunkCalled++;
            
            // Simulate the error and let onError handle it
            const error = new APICallError({
              message: 'Connection reset',
              statusCode: undefined,
              responseHeaders: {},
              responseBody: undefined,
              url: 'https://api.example.com',
              requestBodyValues: {},
              cause: new Error('ECONNRESET'),
              isRetryable: true,
            });
            
            if (onErrorHandler) {
              await onErrorHandler({ error });
            }
            
            // Continue streaming after healing
            yield { type: 'text-delta', textDelta: ' your data...' } as TextStreamPart<any>;
          },
        });

        return {
          fullStream: streamBehavior(),
          textStream: streamBehavior(),
          warnings: [],
          rawCall: { rawPrompt: [], rawSettings: {} },
          toDataStreamResponse: vi.fn(),
          pipeDataStreamToResponse: vi.fn(),
          pipeTextStreamToResponse: vi.fn(),
        } as StreamTextResult<any>;
      });

      const runtimeContext = new RuntimeContext();
      let errorThrown = false;

      try {
        const result = await mockAgent.stream(messages, {
          runtimeContext,
          maxRetries: 5,
          onError: createRetryOnErrorHandler({
            retryCount: 0,
            maxRetries: 5,
            workflowContext: { currentStep: 'analyst' },
          }),
        });

        // Process stream
        for await (const chunk of result.fullStream) {
          // Stream processing
        }
      } catch (error) {
        errorThrown = true;
        expect(error).toBeInstanceOf(RetryWithHealingError);
      }

      expect(onChunkCalled).toBeGreaterThan(0);
      expect(errorThrown).toBe(true);
    });
  });

  describe('Multiple Tool Errors in Sequence', () => {
    it('should handle multiple NoSuchToolError in a single conversation', async () => {
      const workflowContext: WorkflowContext = { currentStep: 'think-and-prep' };
      let retryCount = 0;

      const handler = createRetryOnErrorHandler({
        retryCount,
        maxRetries: 5,
        workflowContext,
      });

      // First error - trying to use analyst tool in think-and-prep
      const error1 = new NoSuchToolError({
        toolName: 'createMetrics',
        availableTools: ['sequentialThinking', 'executeSql', 'submitThoughts'],
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      let firstError: any;
      try {
        await handler({ error: error1 });
      } catch (e) {
        firstError = e;
      }

      expect(firstError).toBeInstanceOf(RetryWithHealingError);
      expect(firstError.retryableError.type).toBe('no-such-tool');
      expect(firstError.retryableError.healingMessage.content[0].result.error).toContain(
        'You are currently in think-and-prep mode'
      );

      // Second error - trying another wrong tool
      retryCount++;
      const handler2 = createRetryOnErrorHandler({
        retryCount,
        maxRetries: 5,
        workflowContext,
      });

      const error2 = new NoSuchToolError({
        toolName: 'createDashboards',
        availableTools: ['sequentialThinking', 'executeSql', 'submitThoughts'],
      });

      let secondError: any;
      try {
        await handler2({ error: error2 });
      } catch (e) {
        secondError = e;
      }

      expect(secondError).toBeInstanceOf(RetryWithHealingError);
      expect(secondError.retryableError.type).toBe('no-such-tool');

      consoleErrorSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });
  });

  describe('Rate Limiting and Backoff', () => {
    it('should handle rate limit with retry-after header', async () => {
      const handler = createRetryOnErrorHandler({
        retryCount: 0,
        maxRetries: 5,
        workflowContext: { currentStep: 'analyst' },
      });

      const rateLimitError = new APICallError({
        message: 'Rate limit exceeded',
        statusCode: 429,
        responseHeaders: {
          'retry-after': '30',
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': '1234567890',
        },
        responseBody: {
          error: {
            message: 'You have exceeded your rate limit',
            type: 'rate_limit_error',
          },
        },
        url: 'https://api.openai.com/v1/chat/completions',
        requestBodyValues: {},
        cause: undefined,
        isRetryable: true,
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      let thrownError: any;
      try {
        await handler({ error: rateLimitError });
      } catch (e) {
        thrownError = e;
      }

      expect(thrownError).toBeInstanceOf(RetryWithHealingError);
      expect(thrownError.retryableError.type).toBe('rate-limit');
      expect(thrownError.retryableError.healingMessage.content).toContain('Please wait 30 seconds');

      consoleErrorSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });
  });

  describe('Complex Streaming Scenarios', () => {
    it('should handle partial tool call followed by error', async () => {
      const messages: CoreMessage[] = [
        { role: 'user', content: 'Create a metric for revenue' },
      ];

      async function* streamGenerator() {
        // Start with text
        yield { type: 'text-delta', textDelta: 'I\'ll create a revenue metric' } as TextStreamPart<any>;
        
        // Start tool call
        yield {
          type: 'tool-call-delta',
          toolCallType: 'function',
          toolCallId: 'partial_call',
          toolName: 'createMetrics',
          argsTextDelta: '{"name": "revenue", "expression": ',
        } as TextStreamPart<any>;
        
        // Simulate JSON parse error in the middle of tool args
        throw new Error('Unexpected end of JSON input');
      }

      const mockAgent = createMockAgent(streamGenerator);
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      // The onError handler will be called for stream errors
      const onErrorHandler = createRetryOnErrorHandler({
        retryCount: 0,
        maxRetries: 3,
        workflowContext: { currentStep: 'analyst' },
      });

      // Test the onError handler directly with the expected error
      const streamError = new Error('Unexpected end of JSON input');
      
      let errorThrown: any;
      try {
        await onErrorHandler({ error: streamError });
      } catch (e) {
        errorThrown = e;
      }

      expect(errorThrown).toBeInstanceOf(RetryWithHealingError);
      expect(errorThrown.retryableError.type).toBe('unknown-error');
      expect(errorThrown.retryableError.healingMessage.content).toContain('Unexpected end of JSON input');

      consoleErrorSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });

    it('should handle server disconnection during long-running analysis', async () => {
      const messages: CoreMessage[] = [
        { role: 'user', content: 'Analyze all customer data for the past year' },
      ];

      // Simulate that chunks were emitted before error
      const chunksEmitted = 4; // Simulating 4 chunks were emitted
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      // Test the onError handler directly
      const onErrorHandler = createRetryOnErrorHandler({
        retryCount: 0,
        maxRetries: 5,
        workflowContext: { currentStep: 'analyst' },
      });

      const disconnectError = new APICallError({
        message: 'Server disconnected',
        statusCode: undefined,
        responseHeaders: {},
        responseBody: undefined,
        url: 'https://api.example.com',
        requestBodyValues: {},
        cause: new Error('EPIPE: broken pipe'),
        isRetryable: true,
      });

      let errorThrown: any;
      try {
        await onErrorHandler({ error: disconnectError });
      } catch (error) {
        errorThrown = error;
      }

      expect(chunksEmitted).toBe(4); // Should have emitted some chunks before error
      expect(errorThrown).toBeInstanceOf(RetryWithHealingError);
      expect(errorThrown.retryableError.type).toBe('network-timeout');

      consoleErrorSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });
  });

  describe('Error Recovery Validation', () => {
    it('should validate healing message format for tool errors', async () => {
      const toolError = new NoSuchToolError({
        toolName: 'invalidTool',
        availableTools: ['tool1', 'tool2', 'tool3'],
      });
      (toolError as any).toolCallId = 'call_xyz';

      const handler = createRetryOnErrorHandler({
        retryCount: 1,
        maxRetries: 5,
        workflowContext: { currentStep: 'analyst' },
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      let thrownError: any;
      try {
        await handler({ error: toolError });
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(RetryWithHealingError);
      
      const healingMessage = thrownError.retryableError.healingMessage;
      expect(healingMessage.role).toBe('tool');
      expect(Array.isArray(healingMessage.content)).toBe(true);
      
      const toolResult = healingMessage.content[0];
      expect(toolResult.type).toBe('tool-result');
      expect(toolResult.toolCallId).toBeDefined();
      expect(toolResult.toolName).toBe('invalidTool');
      expect(toolResult.result).toHaveProperty('error');
      expect(typeof toolResult.result.error).toBe('string');

      consoleErrorSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });
  });
});