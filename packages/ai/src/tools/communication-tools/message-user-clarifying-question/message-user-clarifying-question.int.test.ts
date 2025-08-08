import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMessageUserClarifyingQuestionTool } from './message-user-clarifying-question';
import type { MessageUserClarifyingQuestionInput } from './message-user-clarifying-question';

// Mock database module
vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn(),
}));

// Mock braintrust
vi.mock('braintrust', () => ({
  wrapTraced: (fn: any) => fn,
}));

describe('messageUserClarifyingQuestion integration', () => {
  const mockUpdateMessageEntries = vi.mocked(updateMessageEntries);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create proper database entries with messageId', async () => {
    const mockContext = {
      messageId: 'test-message-123',
      chatId: 'test-chat-456',
      userId: 'test-user-789',
    };

    const tool = createMessageUserClarifyingQuestionTool(mockContext);

    const input: MessageUserClarifyingQuestionInput = {
      clarifying_question: 'What specific metrics would you like to analyze?',
    };

    // Execute tool with all lifecycle methods
    if (tool.onInputStart) {
      await tool.onInputStart({
        toolCallId: 'test-tool-call-123',
        messages: [],
      } as ToolCallOptions);
    }

    if (tool.onInputAvailable) {
      await tool.onInputAvailable({
        input,
        toolCallId: 'test-tool-call-123',
        messages: [],
      });
    }

    if (tool.execute) {
      const result = await tool.execute(input, {
        toolCallId: 'test-tool-call-123',
        messages: [],
      } as ToolCallOptions);
      expect(result).toEqual({});
    }

    // Verify database calls
    expect(mockUpdateMessageEntries).toHaveBeenCalled();

    // Check initial append call
    const appendCall = mockUpdateMessageEntries.mock.calls
      .map((args) => args[0])
      .find((arg) => arg?.mode === 'append');
    expect(appendCall).toBeDefined();
    expect(appendCall?.messageId).toBe('test-message-123');
    expect(appendCall).toHaveProperty('responseEntry');
    expect(appendCall).toHaveProperty('rawLlmMessage');

    // Check update call
    const updateCall = mockUpdateMessageEntries.mock.calls
      .map((args) => args[0])
      .find((arg) => arg?.mode === 'update');
    expect(updateCall).toBeDefined();
    expect(updateCall?.messageId).toBe('test-message-123');
    expect(updateCall).toHaveProperty('responseEntry');

    // Verify the response entry has the clarifying question
    const responseEntry = updateCall?.responseEntry as
      | { type?: string; message?: string; is_final_message?: boolean }
      | undefined;
    expect(responseEntry).toMatchObject({
      type: 'text',
      message: 'What specific metrics would you like to analyze?',
      is_final_message: true,
    });
  });

  it('should handle streaming updates correctly', async () => {
    const mockContext = {
      messageId: 'test-message-stream',
      chatId: 'test-chat-stream',
      userId: 'test-user-stream',
    };

    const tool = createMessageUserClarifyingQuestionTool(mockContext);

    // Start streaming
    if (tool.onInputStart) {
      await tool.onInputStart({
        toolCallId: 'test-tool-call-123',
        messages: [],
      } as ToolCallOptions);
    }

    // Simulate streaming chunks
    const chunks = [
      '{"clarifying_question":"Please provide',
      ' more details about',
      ' your requirements',
      '"}',
    ];

    if (tool.onInputDelta) {
      for (const chunk of chunks) {
        await tool.onInputDelta({
          inputTextDelta: chunk,
          toolCallId: 'test-tool-call-123',
          messages: [],
        });
      }
    }

    // Finalize
    const completeInput: MessageUserClarifyingQuestionInput = {
      clarifying_question: 'Please provide more details about your requirements',
    };

    if (tool.onInputAvailable) {
      await tool.onInputAvailable({
        input: completeInput,
        toolCallId: 'test-tool-call-123',
        messages: [],
      });
    }

    // Verify multiple update calls during streaming
    const updateCalls = mockUpdateMessageEntries.mock.calls
      .map((args) => args[0])
      .filter((arg) => arg?.mode === 'update');
    expect(updateCalls.length).toBeGreaterThan(0);

    // Verify final update has complete question
    const lastUpdateCall = updateCalls[updateCalls.length - 1] as
      | { responseEntry?: { message?: string } }
      | undefined;
    expect(lastUpdateCall?.responseEntry?.message).toBe(
      'Please provide more details about your requirements'
    );
  });

  it('should handle errors gracefully', async () => {
    // Mock database error
    mockUpdateMessageEntries.mockRejectedValueOnce(new Error('Database error'));

    const mockContext = {
      messageId: 'test-message-error',
      chatId: 'test-chat-error',
      userId: 'test-user-error',
    };

    const tool = createMessageUserClarifyingQuestionTool(mockContext);

    const input: MessageUserClarifyingQuestionInput = {
      clarifying_question: 'What is your budget?',
    };

    // Should not throw even with database error
    if (tool.onInputStart) {
      await expect(
        tool.onInputStart({ toolCallId: 'test-tool-call-123', messages: [] } as ToolCallOptions)
      ).resolves.not.toThrow();
    }

    if (tool.execute) {
      const result = await tool.execute(input, {
        toolCallId: 'test-tool-call-123',
        messages: [],
      } as ToolCallOptions);
      expect(result).toEqual({});
    }
  });

  it('should handle multi-line markdown questions', async () => {
    const mockContext = {
      messageId: 'test-message-markdown',
      chatId: 'test-chat-markdown',
      userId: 'test-user-markdown',
    };

    const tool = createMessageUserClarifyingQuestionTool(mockContext);

    const input: MessageUserClarifyingQuestionInput = {
      clarifying_question: `To better assist you, please provide:

- **Data Sources**: Which tables or databases?
- **Time Frame**: What date range?
- **Metrics**: Which KPIs matter most?
- **Format**: How should results be presented?

This will help me create a more accurate analysis.`,
    };

    // Call lifecycle methods to trigger database updates
    if (tool.onInputStart) {
      await tool.onInputStart({
        toolCallId: 'test-tool-call-123',
        messages: [],
      } as ToolCallOptions);
    }

    if (tool.onInputAvailable) {
      await tool.onInputAvailable({
        input,
        toolCallId: 'test-tool-call-123',
        messages: [],
      });
    }

    if (tool.execute) {
      await tool.execute(input, {
        toolCallId: 'test-tool-call-123',
        messages: [],
      } as ToolCallOptions);
    }

    // Verify the markdown is preserved
    const calls = mockUpdateMessageEntries.mock.calls.map((args) => args[0]);
    const hasMarkdownQuestion = calls.some((arg) => {
      const entry =
        (arg?.responseEntry as { message?: string } | undefined) || (arg?.rawLlmMessage as unknown);
      return entry && JSON.stringify(entry).includes('**Data Sources**');
    });

    expect(hasMarkdownQuestion).toBe(true);
  });
});
