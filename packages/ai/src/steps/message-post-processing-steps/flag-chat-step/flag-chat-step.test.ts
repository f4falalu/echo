import type { CoreMessage } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import {
  flagChatStep,
  flagChatStepExecution,
  flagChatStepParamsSchema,
  flagChatStepResultSchema,
  runFlagChatStep,
} from './flag-chat-step';

// Mock the generateObject function to avoid actual LLM calls in unit tests
vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));

// Mock the Sonnet4 model
vi.mock('../../llm/sonnet-4', () => ({
  Sonnet4: 'mocked-sonnet-4-model',
}));

// Mock braintrust to avoid external dependencies in unit tests
vi.mock('braintrust', () => ({
  wrapTraced: vi.fn((fn) => fn),
}));

describe('flag-chat-step', () => {
  describe('schema validation', () => {
    it('should validate input schema correctly', () => {
      const validInput = {
        userName: 'John Doe',
        datasets: 'product, sales',
        conversationHistory: [
          { role: 'user' as const, content: 'Hello' },
          { role: 'assistant' as const, content: 'Hi there!' },
        ],
      };

      const result = flagChatStepParamsSchema.safeParse(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userName).toBe('John Doe');
        expect(result.data.datasets).toBe('product, sales');
        expect(result.data.conversationHistory).toHaveLength(2);
      }
    });

    it('should handle optional conversationHistory in input schema', () => {
      const inputWithoutHistory = {
        userName: 'John Doe',
        datasets: 'product, sales',
      };

      const result = flagChatStepParamsSchema.safeParse(inputWithoutHistory);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.conversationHistory).toBeUndefined();
      }
    });

    it('should validate result schema for flagChat type', () => {
      const flagChatResult = {
        type: 'flagChat',
        summaryMessage: 'User experienced an issue with empty results',
        summaryTitle: 'Empty Results Issue',
      };

      const result = flagChatStepResultSchema.safeParse(flagChatResult);
      expect(result.success).toBe(true);
    });

    it('should validate result schema for noIssuesFound type', () => {
      const noIssuesResult = {
        type: 'noIssuesFound',
        message: 'Analysis complete, no issues detected',
      };

      const result = flagChatStepResultSchema.safeParse(noIssuesResult);
      expect(result.success).toBe(true);
    });
  });

  describe('runFlagChatStep', () => {
    it('should handle flagChat result from LLM', async () => {
      const mockConversation: CoreMessage[] = [
        { role: 'user', content: 'Find my sales data' },
        { role: 'assistant', content: 'I could not find any sales data matching your criteria.' },
      ];

      // Mock generateObject to return a flagChat result
      const { generateObject } = await import('ai');
      vi.mocked(generateObject).mockResolvedValue({
        object: {
          type: 'flagChat',
          summary_message: 'Kevin requested sales data but no results were returned.',
          summary_title: 'No Results Found',
        },
      } as any);

      const params = {
        userName: 'Kevin',
        datasets: 'sales, products',
        conversationHistory: mockConversation,
      };

      const result = await runFlagChatStep(params);

      expect(result.type).toBe('flagChat');
      if (result.type === 'flagChat') {
        expect(result.summaryMessage).toBe(
          'Kevin requested sales data but no results were returned.'
        );
        expect(result.summaryTitle).toBe('No Results Found');
      }
    });

    it('should handle noIssuesFound result from LLM', async () => {
      const mockConversation: CoreMessage[] = [
        { role: 'user', content: 'Show me revenue charts' },
        { role: 'assistant', content: 'Here is your revenue chart with $10,000 total.' },
      ];

      // Mock generateObject to return a noIssuesFound result
      const { generateObject } = await import('ai');
      vi.mocked(generateObject).mockResolvedValue({
        object: {
          type: 'noIssuesFound',
          message: 'Analysis complete, user received proper results.',
        },
      } as any);

      const params = {
        userName: 'Alice',
        datasets: 'revenue, charts',
        conversationHistory: mockConversation,
      };

      const result = await runFlagChatStep(params);

      expect(result.type).toBe('noIssuesFound');
      if (result.type === 'noIssuesFound') {
        expect(result.message).toBe('Analysis complete, user received proper results.');
      }
    });

    it('should handle LLM errors gracefully', async () => {
      const mockConversation: CoreMessage[] = [{ role: 'user', content: 'Test request' }];

      // Mock generateObject to throw an error
      const { generateObject } = await import('ai');
      vi.mocked(generateObject).mockRejectedValue(new Error('LLM service unavailable'));

      const params = {
        userName: 'Bob',
        datasets: 'test data',
        conversationHistory: mockConversation,
      };

      const result = await runFlagChatStep(params);

      expect(result.type).toBe('noIssuesFound');
      if (result.type === 'noIssuesFound') {
        expect(result.message).toBe('Unable to analyze chat history for issues at this time.');
      }
    });

    it('should handle empty conversation history', async () => {
      // Mock generateObject to return a noIssuesFound result
      const { generateObject } = await import('ai');
      vi.mocked(generateObject).mockResolvedValue({
        object: {
          type: 'noIssuesFound',
          message: 'No conversation to analyze.',
        },
      } as any);

      const params = {
        userName: 'Charlie',
        datasets: 'empty test',
        conversationHistory: undefined,
      };

      const result = await runFlagChatStep(params);

      expect(result.type).toBe('noIssuesFound');
      if (result.type === 'noIssuesFound') {
        expect(result.message).toBe('No conversation to analyze.');
      }
    });
  });

  describe('legacy flagChatStepExecution', () => {
    it('should handle legacy input format and return legacy output format', async () => {
      // Mock generateObject to return a flagChat result
      const { generateObject } = await import('ai');
      vi.mocked(generateObject).mockResolvedValue({
        object: {
          type: 'flagChat',
          summary_message: 'Legacy test message',
          summary_title: 'Legacy Test',
        },
      } as any);

      const legacyInput = {
        conversationHistory: [{ role: 'user' as const, content: 'Legacy test' }],
        userName: 'Legacy User',
        messageId: 'msg_123',
        userId: 'user_456',
        chatId: 'chat_789',
        isFollowUp: false,
        isSlackFollowUp: false,
        previousMessages: [],
        datasets: 'legacy datasets',
      };

      const result = await flagChatStepExecution({ inputData: legacyInput });

      // Verify all legacy fields are preserved
      expect(result.conversationHistory).toEqual(legacyInput.conversationHistory);
      expect(result.userName).toBe(legacyInput.userName);
      expect(result.messageId).toBe(legacyInput.messageId);
      expect(result.userId).toBe(legacyInput.userId);
      expect(result.chatId).toBe(legacyInput.chatId);
      expect(result.isFollowUp).toBe(legacyInput.isFollowUp);
      expect(result.isSlackFollowUp).toBe(legacyInput.isSlackFollowUp);
      expect(result.previousMessages).toEqual(legacyInput.previousMessages);
      expect(result.datasets).toBe(legacyInput.datasets);

      // Verify new result fields are present
      expect(result.toolCalled).toBe('flagChat');
      expect(result.flagChatMessage).toBe('Legacy test message');
      expect(result.flagChatTitle).toBe('Legacy Test');
    });
  });

  describe('step configuration', () => {
    it('should export step configuration object', () => {
      expect(flagChatStep).toBeDefined();
      expect(flagChatStep.id).toBe('flag-chat');
      expect(flagChatStep.description).toContain('analyzes the chat history');
      expect(flagChatStep.inputSchema).toBe(flagChatStepParamsSchema);
      expect(flagChatStep.outputSchema).toBe(flagChatStepResultSchema);
      expect(flagChatStep.execute).toBe(runFlagChatStep);
    });
  });
});
