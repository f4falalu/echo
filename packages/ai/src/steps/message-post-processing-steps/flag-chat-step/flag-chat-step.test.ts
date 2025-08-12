import type { CoreMessage } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import {
  flagChatStep,
  flagChatStepExecution,
  flagChatStepInputSchema,
  flagChatStepLLMOutputSchema,
  flagChatStepOutputSchema,
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

      const result = flagChatStepInputSchema.safeParse(validInput);
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

      const result = flagChatStepInputSchema.safeParse(inputWithoutHistory);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.conversationHistory).toBeUndefined();
      }
    });

    it('should validate LLM output schema for flagChat type', () => {
      const flagChatOutput = {
        type: 'flagChat',
        summary_message: 'User experienced an issue with empty results',
        summary_title: 'Empty Results Issue',
      };

      const result = flagChatStepLLMOutputSchema.safeParse(flagChatOutput);
      expect(result.success).toBe(true);
    });

    it('should validate LLM output schema for noIssuesFound type', () => {
      const noIssuesOutput = {
        type: 'noIssuesFound',
        message: 'Analysis complete, no issues detected',
      };

      const result = flagChatStepLLMOutputSchema.safeParse(noIssuesOutput);
      expect(result.success).toBe(true);
    });

    it('should validate discriminated union output schema for flagChat', () => {
      const flagChatResult = {
        type: 'flagChat',
        summary_message: 'User experienced an issue',
        summary_title: 'Issue Found',
      };

      const result = flagChatStepOutputSchema.safeParse(flagChatResult);
      expect(result.success).toBe(true);
    });

    it('should validate discriminated union output schema for noIssuesFound', () => {
      const noIssuesResult = {
        type: 'noIssuesFound',
        message: 'No issues detected',
      };

      const result = flagChatStepOutputSchema.safeParse(noIssuesResult);
      expect(result.success).toBe(true);
    });

    it('should validate complete result schema', () => {
      const completeResult = {
        conversationHistory: [{ role: 'user' as const, content: 'Test message' }],
        userName: 'John Doe',
        datasets: 'test dataset',
        flagChatResult: {
          type: 'flagChat' as const,
          summary_message: 'Issue found',
          summary_title: 'Issue Title',
        },
        toolCalled: 'flagChat',
        flagChatMessage: 'Issue found',
        flagChatTitle: 'Issue Title',
      };

      const result = flagChatStepResultSchema.safeParse(completeResult);
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

      expect(result.userName).toBe('Kevin');
      expect(result.datasets).toBe('sales, products');
      expect(result.conversationHistory).toEqual(mockConversation);
      expect(result.flagChatResult.type).toBe('flagChat');
      expect(result.toolCalled).toBe('flagChat');
      expect(result.flagChatMessage).toBe(
        'Kevin requested sales data but no results were returned.'
      );
      expect(result.flagChatTitle).toBe('No Results Found');
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

      expect(result.userName).toBe('Alice');
      expect(result.datasets).toBe('revenue, charts');
      expect(result.conversationHistory).toEqual(mockConversation);
      expect(result.flagChatResult.type).toBe('noIssuesFound');
      expect(result.toolCalled).toBe('noIssuesFound');
      expect(result.flagChatMessage).toBe('Analysis complete, user received proper results.');
      expect(result.flagChatTitle).toBe('No Issues Found');
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

      expect(result.userName).toBe('Bob');
      expect(result.datasets).toBe('test data');
      expect(result.flagChatResult.type).toBe('noIssuesFound');
      expect(result.toolCalled).toBe('noIssuesFound');
      expect(result.flagChatMessage).toBe(
        'Unable to analyze chat history for issues at this time.'
      );
      expect(result.flagChatTitle).toBe('No Issues Found');
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

      expect(result.userName).toBe('Charlie');
      expect(result.datasets).toBe('empty test');
      expect(result.conversationHistory).toBeUndefined();
      expect(result.flagChatResult.type).toBe('noIssuesFound');
      expect(result.toolCalled).toBe('noIssuesFound');
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
      expect(flagChatStep.inputSchema).toBe(flagChatStepInputSchema);
      expect(flagChatStep.outputSchema).toBe(flagChatStepResultSchema);
      expect(flagChatStep.execute).toBe(runFlagChatStep);
    });
  });
});
