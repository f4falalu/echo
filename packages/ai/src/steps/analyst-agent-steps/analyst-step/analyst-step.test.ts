import type { ModelMessage } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import { runAnalystAgentStep } from './analyst-step';

// Mock the analyst agent module
vi.mock('../../../agents/analyst-agent/analyst-agent', () => ({
  createAnalystAgent: vi.fn(),
  AnalystAgentOptionsSchema: {
    parse: (data: unknown) => data,
  },
  AnalystStreamOptionsSchema: {
    parse: (data: unknown) => data,
  },
}));

describe('runAnalystAgentStep', () => {
  it('should successfully run analyst agent and return messages', async () => {
    const mockMessages: ModelMessage[] = [
      { role: 'user', content: 'Test prompt' },
      { role: 'assistant', content: 'Test response' },
    ];

    const mockStream = {
      response: Promise.resolve({
        messages: mockMessages,
      }),
    };

    const mockAgent = {
      stream: vi.fn().mockResolvedValue(mockStream),
    };

    const { createAnalystAgent } = await import('../../../agents/analyst-agent/analyst-agent');
    (createAnalystAgent as ReturnType<typeof vi.fn>).mockReturnValue(mockAgent);

    const result = await runAnalystAgentStep({
      options: {
        organizationId: 'test-org-id',
        chatId: 'test-chat-id',
        messageId: 'test-message-id',
        workflowStartTime: Date.now(),
        userId: 'test-user-id',
        dataSourceId: 'test-ds-id',
        dataSourceSyntax: 'postgres',
        datasets: [],
        userPersonalizationMessageContent: '',
      },
      streamOptions: {
        messages: [{ role: 'user', content: 'Test prompt' }],
      },
    });

    expect(result).toEqual({ messages: mockMessages });
    expect(mockAgent.stream).toHaveBeenCalledTimes(1);
  });

  it('should handle invalid response shape', async () => {
    const mockStream = {
      response: Promise.resolve({
        // Missing messages array
        someOtherField: 'value',
      }),
    };

    const mockAgent = {
      stream: vi.fn().mockResolvedValue(mockStream),
    };

    const { createAnalystAgent } = await import('../../../agents/analyst-agent/analyst-agent');
    (createAnalystAgent as ReturnType<typeof vi.fn>).mockReturnValue(mockAgent);

    await expect(
      runAnalystAgentStep({
        options: {
          organizationId: 'test-org-id',
          chatId: 'test-chat-id',
          messageId: 'test-message-id',
          workflowStartTime: Date.now(),
          userId: 'test-user-id',
          dataSourceId: 'test-ds-id',
          dataSourceSyntax: 'postgres',
          datasets: [],
          userPersonalizationMessageContent: '',
        },
        streamOptions: {
          messages: [{ role: 'user', content: 'Test prompt' }],
        },
      })
    ).rejects.toThrow('Analyst agent returned an invalid response shape (missing messages array)');
  });

  it('should handle null response', async () => {
    const mockStream = {
      response: Promise.resolve(null),
    };

    const mockAgent = {
      stream: vi.fn().mockResolvedValue(mockStream),
    };

    const { createAnalystAgent } = await import('../../../agents/analyst-agent/analyst-agent');
    (createAnalystAgent as ReturnType<typeof vi.fn>).mockReturnValue(mockAgent);

    await expect(
      runAnalystAgentStep({
        options: {
          organizationId: 'test-org-id',
          chatId: 'test-chat-id',
          messageId: 'test-message-id',
          workflowStartTime: Date.now(),
          userId: 'test-user-id',
          dataSourceId: 'test-ds-id',
          dataSourceSyntax: 'postgres',
          datasets: [],
          userPersonalizationMessageContent: '',
        },
        streamOptions: {
          messages: [{ role: 'user', content: 'Test prompt' }],
        },
      })
    ).rejects.toThrow('Analyst agent returned an invalid response shape (missing messages array)');
  });

  it('should log errors with context', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockError = new Error('Test error');
    const mockAgent = {
      stream: vi.fn().mockRejectedValue(mockError),
    };

    const { createAnalystAgent } = await import('../../../agents/analyst-agent/analyst-agent');
    (createAnalystAgent as ReturnType<typeof vi.fn>).mockReturnValue(mockAgent);

    await expect(
      runAnalystAgentStep({
        options: {
          organizationId: 'test-org-id',
          chatId: 'test-chat-id',
          messageId: 'test-message-id',
          workflowStartTime: Date.now(),
          userId: 'test-user-id',
          dataSourceId: 'test-ds-id',
          dataSourceSyntax: 'postgres',
          datasets: [],
          userPersonalizationMessageContent: '',
        },
        streamOptions: {
          messages: [{ role: 'user', content: 'Test prompt' }],
        },
      })
    ).rejects.toThrow('Test error');

    expect(consoleErrorSpy).toHaveBeenCalledWith('runAnalystAgentStep error', {
      message: 'Test error',
      chatId: 'test-chat-id',
      messageId: 'test-message-id',
      userId: 'test-user-id',
    });

    consoleErrorSpy.mockRestore();
  });
});
