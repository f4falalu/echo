import { describe, expect, test, vi } from 'vitest';
import type { CoreMessage } from 'ai';
import { formatInitialMessageStepExecution } from '../../../src/steps/post-processing/format-initial-message-step';

// Mock the agent and its dependencies
vi.mock('@mastra/core', () => ({
  Agent: vi.fn().mockImplementation(() => ({
    generate: vi.fn().mockResolvedValue({
      toolCalls: [{
        toolName: 'generateSummary',
        args: {
          summary_message: 'Test summary message',
          title: 'Test Title'
        }
      }]
    })
  })),
  createStep: vi.fn((config) => config)
}));

vi.mock('braintrust', () => ({
  wrapTraced: vi.fn((fn) => fn)
}));

vi.mock('../../../src/utils/models/anthropic-cached', () => ({
  anthropicCachedModel: vi.fn(() => 'mocked-model')
}));

vi.mock('../../../src/utils/standardizeMessages', () => ({
  standardizeMessages: vi.fn((msg) => [{ role: 'user', content: msg }])
}));

vi.mock('../../../src/tools/post-processing/generate-summary', () => ({
  generateSummary: {}
}));

describe('Format Initial Message Step Unit Tests', () => {
  test('should include chat history in context message when present', async () => {
    const mockConversationHistory: CoreMessage[] = [
      { role: 'user', content: 'What is the total revenue?' },
      { role: 'assistant', content: 'The total revenue is $1M' }
    ];

    const inputData = {
      conversationHistory: mockConversationHistory,
      userName: 'John Doe',
      messageId: 'msg-123',
      userId: 'user-123',
      chatId: 'chat-123',
      isFollowUp: false,
      isSlackFollowUp: false,
      previousMessages: [],
      datasets: 'test datasets',
      toolCalled: 'flagChat',
      flagChatMessage: 'Major issues found',
      flagChatTitle: 'Issues Detected',
      assumptions: [
        {
          descriptiveTitle: 'Revenue Calculation',
          classification: 'metricDefinition' as const,
          explanation: 'Assumed revenue includes all sources',
          label: 'major' as const
        }
      ]
    };

    const result = await formatInitialMessageStepExecution({ inputData });

    expect(result.summaryMessage).toBe('Test summary message');
    expect(result.summaryTitle).toBe('Test Title');
    expect(result.conversationHistory).toEqual(mockConversationHistory);
  });

  test('should handle empty conversation history', async () => {
    const inputData = {
      conversationHistory: [],
      userName: 'Jane Smith',
      messageId: 'msg-456',
      userId: 'user-456',
      chatId: 'chat-456',
      isFollowUp: false,
      isSlackFollowUp: false,
      previousMessages: [],
      datasets: 'test datasets',
      toolCalled: 'flagChat',
      flagChatMessage: 'Minor issues found',
      flagChatTitle: 'Minor Issues',
      assumptions: [
        {
          descriptiveTitle: 'Customer Count',
          classification: 'dataQuality' as const,
          explanation: 'Included all customer statuses',
          label: 'major' as const
        }
      ]
    };

    const result = await formatInitialMessageStepExecution({ inputData });

    expect(result.summaryMessage).toBe('Test summary message');
    expect(result.summaryTitle).toBe('Test Title');
    expect(result.conversationHistory).toEqual([]);
  });

  test('should handle missing conversation history', async () => {
    const inputData = {
      userName: 'Bob Johnson',
      messageId: 'msg-789',
      userId: 'user-789',
      chatId: 'chat-789',
      isFollowUp: false,
      isSlackFollowUp: false,
      previousMessages: [],
      datasets: 'test datasets',
      toolCalled: 'flagChat',
      flagChatMessage: 'No issues found',
      flagChatTitle: 'All Clear',
      assumptions: [
        {
          descriptiveTitle: 'Date Range',
          classification: 'timePeriodInterpretation' as const,
          explanation: 'Assumed current month',
          label: 'major' as const
        }
      ]
    };

    const result = await formatInitialMessageStepExecution({ inputData });

    expect(result.summaryMessage).toBe('Test summary message');
    expect(result.summaryTitle).toBe('Test Title');
    expect(result.conversationHistory).toBeUndefined();
  });

  test('should return input data unchanged when no major assumptions', async () => {
    const inputData = {
      conversationHistory: [
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi there!' }
      ],
      userName: 'Alice Cooper',
      messageId: 'msg-999',
      userId: 'user-999',
      chatId: 'chat-999',
      isFollowUp: false,
      isSlackFollowUp: false,
      previousMessages: [],
      datasets: 'test datasets',
      toolCalled: 'noIssuesFound',
      assumptions: [
        {
          descriptiveTitle: 'Minor Detail',
          classification: 'dataFormat' as const,
          explanation: 'Used standard format',
          label: 'minor' as const
        }
      ]
    };

    const result = await formatInitialMessageStepExecution({ inputData });

    expect(result).toEqual(inputData);
    expect(result.summaryMessage).toBeUndefined();
    expect(result.summaryTitle).toBeUndefined();
  });
});