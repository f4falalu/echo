import type { CoreMessage } from 'ai';
import { 
  APICallError, 
  EmptyResponseBodyError, 
  InvalidToolArgumentsError, 
  JSONParseError, 
  NoSuchToolError 
} from 'ai';
import { describe, expect, it, vi } from 'vitest';
import { createRetryOnErrorHandler } from '../../../src/utils/retry/retry-helpers';
import { detectRetryableError } from '../../../src/utils/retry/retry-agent-stream';
import { RetryWithHealingError } from '../../../src/utils/retry/retry-error';
import {
  applyHealingStrategy,
  determineHealingStrategy,
  shouldRetryWithoutHealing,
} from '../../../src/utils/retry/healing-strategies';
import type { WorkflowContext } from '../../../src/utils/retry/types';

describe('Healing Behavior - Different Error Types', () => {
  describe('EmptyResponseBodyError - Should Remove Bad Message', () => {
    it('should remove empty assistant response and ask to continue', () => {
      const messages: CoreMessage[] = [
        { role: 'user', content: 'Analyze my revenue data' },
        { role: 'assistant', content: '' }, // Empty response that caused error
      ];

      const error = new EmptyResponseBodyError({
        message: 'Empty response body',
      });

      const retryableError = detectRetryableError(error);
      expect(retryableError).not.toBeNull();
      expect(retryableError?.type).toBe('empty-response');

      const strategy = determineHealingStrategy(retryableError!);
      expect(strategy.shouldRemoveLastAssistantMessage).toBe(true);
      expect(strategy.healingMessage?.content).toBe('Please continue with your analysis.');

      const healedMessages = applyHealingStrategy(messages, strategy);
      expect(healedMessages).toHaveLength(2);
      expect(healedMessages[0]?.content).toBe('Analyze my revenue data');
      expect(healedMessages[1]?.content).toBe('Please continue with your analysis.');
      
      // The empty assistant message should be gone
      expect(healedMessages.find(m => m.role === 'assistant' && m.content === '')).toBeUndefined();
    });
  });

  describe('JSONParseError - Should Remove Malformed Message', () => {
    it('should remove malformed JSON response and retry', () => {
      const messages: CoreMessage[] = [
        { role: 'user', content: 'Create a metric' },
        { 
          role: 'assistant', 
          content: [
            { type: 'text', text: 'Creating metric...' },
            { 
              type: 'tool-call', 
              toolCallId: '123', 
              toolName: 'createMetrics',
              args: '{"name": "revenue", "expression": ' // Incomplete JSON
            }
          ]
        },
      ];

      const error = new JSONParseError({
        message: 'Invalid JSON',
        text: '{"name": "revenue", "expression": ',
        cause: new SyntaxError('Unexpected end of JSON input'),
      });

      const retryableError = detectRetryableError(error);
      expect(retryableError?.type).toBe('json-parse-error');

      const strategy = determineHealingStrategy(retryableError!);
      expect(strategy.shouldRemoveLastAssistantMessage).toBe(true);

      const healedMessages = applyHealingStrategy(messages, strategy);
      expect(healedMessages).toHaveLength(2);
      expect(healedMessages[1]?.content).toBe('Please continue with your analysis.');
      
      // The malformed assistant message should be removed
      expect(healedMessages.find(m => m.role === 'assistant')).toBeUndefined();
    });
  });

  describe('NoSuchToolError - Should Add Healing Without Removing', () => {
    it('should keep the tool attempt and add healing message', () => {
      const messages: CoreMessage[] = [
        { role: 'user', content: 'Create a dashboard' },
        { 
          role: 'assistant', 
          content: [
            { 
              type: 'tool-call', 
              toolCallId: 'call_123', 
              toolName: 'createDashboards',
              args: { name: 'Revenue Dashboard' }
            }
          ]
        },
      ];

      const error = new NoSuchToolError({
        toolName: 'createDashboards',
        availableTools: ['sequentialThinking', 'executeSql', 'submitThoughts'],
      });

      const context: WorkflowContext = { currentStep: 'think-and-prep' };
      const retryableError = detectRetryableError(error, context);
      expect(retryableError?.type).toBe('no-such-tool');

      const strategy = determineHealingStrategy(retryableError!);
      expect(strategy.shouldRemoveLastAssistantMessage).toBe(false);
      expect(strategy.healingMessage).toBeDefined();

      const healedMessages = applyHealingStrategy(messages, strategy);
      expect(healedMessages).toHaveLength(3);
      
      // Original messages should still be there
      expect(healedMessages[0]?.content).toBe('Create a dashboard');
      expect(healedMessages[1]?.role).toBe('assistant');
      
      // Healing message should be added
      expect(healedMessages[2]?.role).toBe('tool');
      expect(healedMessages[2]?.content[0].type).toBe('tool-result');
      expect(healedMessages[2]?.content[0].result.error).toContain('Tool "createDashboards" is not available');
    });
  });

  describe('InvalidToolArgumentsError - Should Add Error Result', () => {
    it('should keep the tool call and add error result', () => {
      const messages: CoreMessage[] = [
        { role: 'user', content: 'Query the database' },
        { 
          role: 'assistant', 
          content: [
            { 
              type: 'tool-call', 
              toolCallId: 'call_456', 
              toolName: 'executeSql',
              args: { query: 123 } // Wrong type
            }
          ]
        },
      ];

      const error = new InvalidToolArgumentsError({
        toolName: 'executeSql',
        toolCallId: 'call_456',
        args: { query: 123 },
        cause: {
          errors: [
            { path: ['query'], message: 'Expected string, received number' }
          ],
        },
      });
      (error as any).name = 'AI_InvalidToolArgumentsError';
      (error as any).toolCallId = 'call_456';

      const retryableError = detectRetryableError(error);
      expect(retryableError?.type).toBe('invalid-tool-arguments');

      const strategy = determineHealingStrategy(retryableError!);
      expect(strategy.shouldRemoveLastAssistantMessage).toBe(false);

      const healedMessages = applyHealingStrategy(messages, strategy);
      expect(healedMessages).toHaveLength(3);
      
      // Tool error result should be added
      const toolResult = healedMessages[2];
      expect(toolResult?.role).toBe('tool');
      expect(toolResult?.content[0].result.error).toContain('query: Expected string, received number');
    });
  });

  describe('Network/Server Errors - Should Retry Without Modification', () => {
    it('should retry network errors without healing', () => {
      const messages: CoreMessage[] = [
        { role: 'user', content: 'Analyze data' },
        { role: 'assistant', content: 'Starting analysis...' },
      ];

      const error = new APICallError({
        message: 'Network timeout',
        statusCode: undefined,
        responseHeaders: {},
        responseBody: undefined,
        url: 'https://api.example.com',
        requestBodyValues: {},
        cause: new Error('ETIMEDOUT'),
        isRetryable: true,
      });

      const retryableError = detectRetryableError(error);
      expect(retryableError?.type).toBe('network-timeout');

      const strategy = determineHealingStrategy(retryableError!);
      expect(strategy.shouldRemoveLastAssistantMessage).toBe(false);
      expect(strategy.healingMessage).toBeNull();
      expect(strategy.backoffMultiplier).toBe(2);

      expect(shouldRetryWithoutHealing(retryableError!.type)).toBe(true);

      // Messages should remain unchanged for network errors
      const healedMessages = applyHealingStrategy(messages, strategy);
      expect(healedMessages).toEqual(messages);
    });

    it('should handle rate limit errors with longer backoff', () => {
      const error = new APICallError({
        message: 'Rate limit exceeded',
        statusCode: 429,
        responseHeaders: { 'retry-after': '60' },
        responseBody: 'Too many requests',
        url: 'https://api.example.com',
        requestBodyValues: {},
        cause: undefined,
        isRetryable: true,
      });

      const retryableError = detectRetryableError(error);
      expect(retryableError?.type).toBe('rate-limit');

      const strategy = determineHealingStrategy(retryableError!);
      expect(strategy.backoffMultiplier).toBe(3); // Longer backoff for rate limits
      expect(shouldRetryWithoutHealing('rate-limit')).toBe(true);
    });
  });

  describe('Complete onError Flow with Healing', () => {
    it('should handle empty response error correctly', async () => {
      const handler = createRetryOnErrorHandler({
        retryCount: 0,
        maxRetries: 5,
        workflowContext: { currentStep: 'analyst' },
      });

      const error = new EmptyResponseBodyError({
        message: 'Empty response body',
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      let thrownError: any;
      try {
        await handler({ error });
      } catch (e) {
        thrownError = e;
      }

      expect(thrownError).toBeInstanceOf(RetryWithHealingError);
      expect(thrownError.retryableError.type).toBe('empty-response');
      
      // The healing message should be a simple "continue" message
      expect(thrownError.retryableError.healingMessage.role).toBe('user');
      expect(thrownError.retryableError.healingMessage.content).toBe('Please continue.');

      consoleErrorSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });

    it('should handle JSON parse error correctly', async () => {
      const handler = createRetryOnErrorHandler({
        retryCount: 0,
        maxRetries: 5,
        workflowContext: { currentStep: 'think-and-prep' },
      });

      const error = new JSONParseError({
        message: 'Invalid JSON',
        text: '{"incomplete":',
        cause: new SyntaxError('Unexpected end of JSON input'),
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      let thrownError: any;
      try {
        await handler({ error });
      } catch (e) {
        thrownError = e;
      }

      expect(thrownError).toBeInstanceOf(RetryWithHealingError);
      expect(thrownError.retryableError.type).toBe('json-parse-error');

      consoleErrorSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });
  });
});