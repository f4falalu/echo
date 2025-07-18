import type { CoreMessage } from 'ai';
import { describe, expect, test, vi } from 'vitest';
import { formatFollowUpMessageStepExecution } from './format-follow-up-message-step';

// Mock the agent and its dependencies
vi.mock('@mastra/core', () => ({
  Agent: vi.fn().mockImplementation(() => ({
    generate: vi.fn().mockResolvedValue({
      toolCalls: [
        {
          toolName: 'generateUpdateMessage',
          args: {
            update_message: 'Test update message',
            title: 'Update Title',
          },
        },
      ],
    }),
  })),
  createStep: vi.fn((config) => config),
}));

vi.mock('braintrust', () => ({
  wrapTraced: vi.fn((fn) => fn),
}));

vi.mock('../../../src/utils/models/anthropic-cached', () => ({
  anthropicCachedModel: vi.fn(() => 'mocked-model'),
}));

vi.mock('../../../src/utils/standardizeMessages', () => ({
  standardizeMessages: vi.fn((msg) => [{ role: 'user', content: msg }]),
}));

vi.mock('../../../src/tools/post-processing/generate-update-message', () => ({
  generateUpdateMessage: {},
}));

describe('Format Follow-up Message Step Unit Tests', () => {
  test('should include chat history in context message when present', async () => {
    const mockConversationHistory: CoreMessage[] = [
      { role: 'user', content: 'Initial query about sales' },
      { role: 'assistant', content: 'Sales data analysis complete' },
      { role: 'user', content: 'Can you filter by last 6 months?' },
      { role: 'assistant', content: 'Filtered data shown' },
    ];

    const inputData = {
      conversationHistory: mockConversationHistory,
      userName: 'Sarah Connor',
      messageId: 'msg-fu-123',
      userId: 'user-123',
      chatId: 'chat-123',
      isFollowUp: true,
      isSlackFollowUp: true,
      previousMessages: ['Previous slack message'],
      datasets: 'test datasets',
      toolCalled: 'flagChat',
      flagChatMessage: 'New assumptions made during follow-up',
      flagChatTitle: 'Follow-up Issues',
      assumptions: [
        {
          descriptiveTitle: 'Time Period Filter',
          classification: 'timePeriodInterpretation' as const,
          explanation: 'Assumed last 6 months means from today',
          label: 'major' as const,
        },
      ],
    };

    const result = await formatFollowUpMessageStepExecution({ inputData });

    expect(result.summaryMessage).toBe('Test update message');
    expect(result.summaryTitle).toBe('Update Title');
    expect(result.message).toBe('Test update message');
    expect(result.conversationHistory).toEqual(mockConversationHistory);
  });

  test('should handle empty conversation history', async () => {
    const inputData = {
      conversationHistory: [],
      userName: 'Kyle Reese',
      messageId: 'msg-fu-456',
      userId: 'user-456',
      chatId: 'chat-456',
      isFollowUp: true,
      isSlackFollowUp: false,
      previousMessages: [],
      datasets: 'test datasets',
      toolCalled: 'flagChat',
      flagChatMessage: 'Follow-up issues detected',
      flagChatTitle: 'Issues Found',
      assumptions: [
        {
          descriptiveTitle: 'Data Aggregation',
          classification: 'aggregation' as const,
          explanation: 'Used SUM for totals',
          label: 'major' as const,
        },
      ],
    };

    const result = await formatFollowUpMessageStepExecution({ inputData });

    expect(result.summaryMessage).toBe('Test update message');
    expect(result.summaryTitle).toBe('Update Title');
    expect(result.message).toBe('Test update message');
    expect(result.conversationHistory).toEqual([]);
  });

  test('should handle missing conversation history', async () => {
    const inputData = {
      userName: 'John Connor',
      messageId: 'msg-fu-789',
      userId: 'user-789',
      chatId: 'chat-789',
      isFollowUp: true,
      isSlackFollowUp: true,
      previousMessages: ['Initial slack thread message'],
      datasets: 'test datasets',
      toolCalled: 'flagChat',
      flagChatMessage: 'Additional clarification needed',
      flagChatTitle: 'Needs Clarification',
      assumptions: [
        {
          descriptiveTitle: 'Metric Definition',
          classification: 'metricDefinition' as const,
          explanation: 'Used standard revenue metric',
          label: 'major' as const,
        },
      ],
    };

    const result = await formatFollowUpMessageStepExecution({ inputData });

    expect(result.summaryMessage).toBe('Test update message');
    expect(result.summaryTitle).toBe('Update Title');
    expect(result.message).toBe('Test update message');
    expect(result.conversationHistory).toBeUndefined();
  });

  test('should return input data unchanged when no major assumptions', async () => {
    const inputData = {
      conversationHistory: [
        { role: 'user' as const, content: 'Follow-up question' },
        { role: 'assistant' as const, content: 'Follow-up answer' },
      ],
      userName: 'Marcus Wright',
      messageId: 'msg-fu-999',
      userId: 'user-999',
      chatId: 'chat-999',
      isFollowUp: true,
      isSlackFollowUp: false,
      previousMessages: [],
      datasets: 'test datasets',
      toolCalled: 'noIssuesFound',
      assumptions: [
        {
          descriptiveTitle: 'Formatting Choice',
          classification: 'dataFormat' as const,
          explanation: 'Used comma separation',
          label: 'minor' as const,
        },
        {
          descriptiveTitle: 'Time Zone',
          classification: 'timePeriodInterpretation' as const,
          explanation: 'Used UTC',
          label: 'timeRelated' as const,
        },
      ],
    };

    const result = await formatFollowUpMessageStepExecution({ inputData });

    expect(result).toEqual(inputData);
    expect(result.summaryMessage).toBeUndefined();
    expect(result.summaryTitle).toBeUndefined();
    expect(result.message).toBeUndefined();
  });

  test('should handle multiple major assumptions with conversation history', async () => {
    const mockConversationHistory: CoreMessage[] = [
      { role: 'user', content: 'Show me customer segments' },
      { role: 'assistant', content: 'Here are the segments' },
      { role: 'user', content: 'Filter by enterprise only' },
    ];

    const inputData = {
      conversationHistory: mockConversationHistory,
      userName: 'Kate Brewster',
      messageId: 'msg-fu-multi',
      userId: 'user-multi',
      chatId: 'chat-multi',
      isFollowUp: true,
      isSlackFollowUp: true,
      previousMessages: ['Thread about customer analysis'],
      datasets: 'test datasets',
      toolCalled: 'flagChat',
      flagChatMessage: 'Multiple assumptions in follow-up',
      flagChatTitle: 'Multiple Issues',
      assumptions: [
        {
          descriptiveTitle: 'Enterprise Definition',
          classification: 'segmentDefinition' as const,
          explanation: 'Defined enterprise as >$1M revenue',
          label: 'major' as const,
        },
        {
          descriptiveTitle: 'Customer Status',
          classification: 'dataQuality' as const,
          explanation: 'Included only active customers',
          label: 'major' as const,
        },
      ],
    };

    const result = await formatFollowUpMessageStepExecution({ inputData });

    expect(result.summaryMessage).toBe('Test update message');
    expect(result.summaryTitle).toBe('Update Title');
    expect(result.message).toBe('Test update message');
    expect(result.conversationHistory).toEqual(mockConversationHistory);
  });
});
