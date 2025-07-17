import type { CoreMessage } from 'ai';
import { APICallError } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import { detectRetryableError, handleRetryWithHealing } from '../../../src/utils/retry';
import type { RetryableError, WorkflowContext } from '../../../src/utils/retry';

describe('529 error handling', () => {
  it('should detect 529 as overloaded-error type', () => {
    const error = new APICallError({
      message: 'Server overloaded',
      statusCode: 529,
      responseHeaders: {},
      responseBody: 'Server is overloaded, please try again',
      url: 'https://api.example.com',
      requestBodyValues: {},
    });

    const result = detectRetryableError(error);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('overloaded-error');
    expect(result?.requiresMessageCleanup).toBe(true);
    expect(result?.healingMessage.role).toBe('user');
    expect(result?.healingMessage.content).toContain('Server overloaded (529)');
  });

  it('should apply cleanup for overloaded errors in handleRetryWithHealing', async () => {
    const messagesWithOrphan: CoreMessage[] = [
      {
        role: 'user',
        content: 'Please analyze this data',
      },
      {
        role: 'assistant',
        content: [
          { type: 'text', text: 'Let me analyze that for you' },
          {
            type: 'tool-call',
            toolCallId: 'tc-123',
            toolName: 'analyzeData',
            args: { data: 'test' },
          },
        ],
      },
      // No tool result - connection interrupted
    ];

    const retryableError: RetryableError = {
      type: 'overloaded-error',
      originalError: new Error('529'),
      healingMessage: {
        role: 'user',
        content: 'Server overloaded (529). Retrying after cleanup...',
      },
      requiresMessageCleanup: true,
    };

    const context: WorkflowContext = {
      currentStep: 'analyst',
      availableTools: new Set(['analyzeData', 'createMetrics']),
    };

    const result = await handleRetryWithHealing(retryableError, messagesWithOrphan, 0, context);

    expect(result.healedMessages).toHaveLength(1); // Only user message remains
    expect(result.healedMessages[0]?.role).toBe('user');
    expect(result.shouldContinueWithoutHealing).toBe(false);
    expect(result.backoffDelay).toBeGreaterThan(0);
  });

  it('should handle 529 differently from other 5xx errors', () => {
    const error529 = new APICallError({
      message: 'Server overloaded',
      statusCode: 529,
      responseHeaders: {},
      responseBody: 'Overloaded',
      url: 'https://api.example.com',
      requestBodyValues: {},
    });

    const error500 = new APICallError({
      message: 'Internal server error',
      statusCode: 500,
      responseHeaders: {},
      responseBody: 'Internal error',
      url: 'https://api.example.com',
      requestBodyValues: {},
    });

    const result529 = detectRetryableError(error529);
    const result500 = detectRetryableError(error500);

    expect(result529?.type).toBe('overloaded-error');
    expect(result529?.requiresMessageCleanup).toBe(true);

    expect(result500?.type).toBe('server-error');
    expect(result500?.requiresMessageCleanup).toBeUndefined();
  });

  it('should use longer backoff for 529 errors', async () => {
    const messages: CoreMessage[] = [{ role: 'user', content: 'Test' }];

    const retryableError: RetryableError = {
      type: 'overloaded-error',
      originalError: new Error('529'),
      healingMessage: { role: 'user', content: 'Retrying...' },
    };

    const context: WorkflowContext = {
      currentStep: 'analyst', // Changed from 'test' to valid value
      availableTools: new Set(),
    };

    const result = await handleRetryWithHealing(
      retryableError,
      messages,
      1, // retryCount
      context
    );

    // Backoff should be multiplied by 2 for overloaded errors
    expect(result.backoffDelay).toBeGreaterThan(1000); // Base backoff is usually 1000ms for retry 1
  });

  it('should log cleanup details', async () => {
    const consoleSpy = vi.spyOn(console, 'info');

    const messagesWithMultipleOrphans: CoreMessage[] = [
      {
        role: 'assistant',
        content: [
          { type: 'tool-call', toolCallId: 'tc-1', toolName: 'tool1', args: {} },
          { type: 'tool-call', toolCallId: 'tc-2', toolName: 'tool2', args: {} },
        ],
      },
    ];

    const retryableError: RetryableError = {
      type: 'overloaded-error',
      originalError: new Error('529'),
      healingMessage: { role: 'user', content: 'Retrying...' },
    };

    const context: WorkflowContext = {
      currentStep: 'analyst',
      availableTools: new Set(),
    };

    await handleRetryWithHealing(retryableError, messagesWithMultipleOrphans, 0, context);

    expect(consoleSpy).toHaveBeenCalledWith(
      'analyst: Cleaned incomplete tool calls after 529 error',
      expect.objectContaining({
        originalCount: 1,
        cleanedCount: 0,
        removed: 1,
      })
    );

    consoleSpy.mockRestore();
  });

  it('should preserve messages when no cleanup is needed', async () => {
    const completeMessages: CoreMessage[] = [
      {
        role: 'assistant',
        content: [{ type: 'tool-call', toolCallId: 'tc-123', toolName: 'getTodo', args: {} }],
      },
      {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'tc-123',
            toolName: 'getTodo',
            result: { todo: 'test' },
          },
        ],
      },
    ];

    const retryableError: RetryableError = {
      type: 'overloaded-error',
      originalError: new Error('529'),
      healingMessage: { role: 'user', content: 'Retrying...' },
    };

    const context: WorkflowContext = {
      currentStep: 'analyst',
      availableTools: new Set(),
    };

    const result = await handleRetryWithHealing(retryableError, completeMessages, 0, context);

    expect(result.healedMessages).toHaveLength(2); // No cleanup needed
    expect(result.healedMessages).toEqual(completeMessages);
  });
});
