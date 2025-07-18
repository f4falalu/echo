import type { CoreMessage } from 'ai';
import { describe, expect, it } from 'vitest';
import {
  applyHealingStrategy,
  determineHealingStrategy,
  getErrorExplanationForUser,
  removeLastAssistantMessage,
  shouldRetryWithoutHealing,
} from './healing-strategies';
import type { RetryableError } from './types';

describe('healing-strategies', () => {
  describe('determineHealingStrategy', () => {
    it('should keep message and provide healing for tool errors', () => {
      const toolError: RetryableError = {
        type: 'no-such-tool',
        originalError: new Error('Tool not found'),
        healingMessage: {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: '123',
              toolName: 'invalidTool',
              result: { error: 'Tool not available' },
            },
          ],
        },
      };

      const strategy = determineHealingStrategy(toolError);

      expect(strategy.shouldRemoveLastAssistantMessage).toBe(false);
      expect(strategy.healingMessage).toBe(toolError.healingMessage);
      expect(strategy.backoffMultiplier).toBeUndefined();
    });

    it('should remove message for empty response errors', () => {
      const emptyError: RetryableError = {
        type: 'empty-response',
        originalError: new Error('Empty response'),
        healingMessage: { role: 'user', content: 'Please continue.' },
      };

      const strategy = determineHealingStrategy(emptyError);

      expect(strategy.shouldRemoveLastAssistantMessage).toBe(true);
      expect(strategy.healingMessage?.content).toBe('Please continue with your analysis.');
    });

    it('should remove message for JSON parse errors', () => {
      const jsonError: RetryableError = {
        type: 'json-parse-error',
        originalError: new Error('Invalid JSON'),
        healingMessage: { role: 'user', content: 'Format error' },
      };

      const strategy = determineHealingStrategy(jsonError);

      expect(strategy.shouldRemoveLastAssistantMessage).toBe(true);
      expect(strategy.healingMessage?.content).toBe('Please continue with your analysis.');
    });

    it('should retry without healing for network errors', () => {
      const networkError: RetryableError = {
        type: 'network-timeout',
        originalError: new Error('Network timeout'),
        healingMessage: { role: 'user', content: 'Network error' },
      };

      const strategy = determineHealingStrategy(networkError);

      expect(strategy.shouldRemoveLastAssistantMessage).toBe(false);
      expect(strategy.healingMessage).toBeNull();
      expect(strategy.backoffMultiplier).toBe(2);
    });

    it('should have longer backoff for rate limit errors', () => {
      const rateLimitError: RetryableError = {
        type: 'rate-limit',
        originalError: new Error('Rate limited'),
        healingMessage: { role: 'user', content: 'Rate limit' },
      };

      const strategy = determineHealingStrategy(rateLimitError);

      expect(strategy.shouldRemoveLastAssistantMessage).toBe(false);
      expect(strategy.healingMessage).toBeNull();
      expect(strategy.backoffMultiplier).toBe(3);
    });
  });

  describe('removeLastAssistantMessage', () => {
    it('should remove last assistant message', () => {
      const messages: CoreMessage[] = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
        { role: 'user', content: 'How are you?' },
        { role: 'assistant', content: 'I am doing well' },
      ];

      const result = removeLastAssistantMessage(messages);

      expect(result).toHaveLength(3);
      expect(result[result.length - 1]?.content).toBe('How are you?');
    });

    it('should remove assistant message and subsequent tool results', () => {
      const messages: CoreMessage[] = [
        { role: 'user', content: 'Hello' },
        {
          role: 'assistant',
          content: [
            { type: 'text', text: 'Let me help' },
            { type: 'tool-call', toolCallId: '123', toolName: 'test', args: {} },
          ],
        },
        {
          role: 'tool',
          content: [{ type: 'tool-result', toolCallId: '123', toolName: 'test', result: {} }],
        },
      ];

      const result = removeLastAssistantMessage(messages);

      expect(result).toHaveLength(1);
      expect(result[0]?.role).toBe('user');
    });

    it('should handle no assistant messages', () => {
      const messages: CoreMessage[] = [
        { role: 'user', content: 'Hello' },
        { role: 'user', content: 'Anyone there?' },
      ];

      const result = removeLastAssistantMessage(messages);

      expect(result).toEqual(messages);
    });

    it('should only remove last assistant message when multiple exist', () => {
      const messages: CoreMessage[] = [
        { role: 'assistant', content: 'First response' },
        { role: 'user', content: 'Question' },
        { role: 'assistant', content: 'Second response' },
      ];

      const result = removeLastAssistantMessage(messages);

      expect(result).toHaveLength(2);
      expect(result[0]?.content).toBe('First response');
      expect(result[1]?.content).toBe('Question');
    });
  });

  describe('applyHealingStrategy', () => {
    it('should remove message and add healing for empty response', () => {
      const messages: CoreMessage[] = [
        { role: 'user', content: 'Tell me about X' },
        { role: 'assistant', content: '' }, // Empty response
      ];

      const strategy = {
        shouldRemoveLastAssistantMessage: true,
        healingMessage: {
          role: 'user',
          content: 'Please continue with your analysis.',
        } as CoreMessage,
      };

      const result = applyHealingStrategy(messages, strategy);

      expect(result).toHaveLength(2);
      expect(result[0]?.content).toBe('Tell me about X');
      expect(result[1]?.content).toBe('Please continue with your analysis.');
    });

    it('should add healing without removing for tool errors', () => {
      const messages: CoreMessage[] = [
        { role: 'user', content: 'Analyze data' },
        {
          role: 'assistant',
          content: [{ type: 'tool-call', toolCallId: '123', toolName: 'wrongTool', args: {} }],
        },
      ];

      const strategy = {
        shouldRemoveLastAssistantMessage: false,
        healingMessage: {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: '123',
              toolName: 'wrongTool',
              result: { error: 'Tool not found' },
            },
          ],
        } as CoreMessage,
      };

      const result = applyHealingStrategy(messages, strategy);

      expect(result).toHaveLength(3);
      expect(result[2]?.role).toBe('tool');
    });

    it('should handle no healing message', () => {
      const messages: CoreMessage[] = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi' },
      ];

      const strategy = {
        shouldRemoveLastAssistantMessage: false,
        healingMessage: null,
      };

      const result = applyHealingStrategy(messages, strategy);

      expect(result).toEqual(messages);
    });
  });

  describe('shouldRetryWithoutHealing', () => {
    it('should return true for network/server errors', () => {
      expect(shouldRetryWithoutHealing('network-timeout')).toBe(true);
      expect(shouldRetryWithoutHealing('server-error')).toBe(true);
      expect(shouldRetryWithoutHealing('rate-limit')).toBe(true);
    });

    it('should return false for other error types', () => {
      expect(shouldRetryWithoutHealing('no-such-tool')).toBe(false);
      expect(shouldRetryWithoutHealing('empty-response')).toBe(false);
      expect(shouldRetryWithoutHealing('json-parse-error')).toBe(false);
      expect(shouldRetryWithoutHealing('invalid-tool-arguments')).toBe(false);
    });
  });

  describe('getErrorExplanationForUser', () => {
    it('should provide explanations for specific error types', () => {
      const emptyError: RetryableError = {
        type: 'empty-response',
        originalError: new Error(),
        healingMessage: { role: 'user', content: '' },
      };
      expect(getErrorExplanationForUser(emptyError)).toBe(
        "The assistant's response was incomplete. Retrying..."
      );

      const jsonError: RetryableError = {
        type: 'json-parse-error',
        originalError: new Error(),
        healingMessage: { role: 'user', content: '' },
      };
      expect(getErrorExplanationForUser(jsonError)).toBe(
        'There was a formatting issue with the response. Retrying...'
      );

      const toolError: RetryableError = {
        type: 'no-such-tool',
        originalError: new Error(),
        healingMessage: { role: 'user', content: '' },
      };
      expect(getErrorExplanationForUser(toolError)).toBe(
        "The assistant tried to use a tool that's not available in the current mode."
      );
    });

    it('should return null for errors without explanations', () => {
      const networkError: RetryableError = {
        type: 'network-timeout',
        originalError: new Error(),
        healingMessage: { role: 'user', content: '' },
      };
      expect(getErrorExplanationForUser(networkError)).toBeNull();
    });
  });
});
