import { updateMessageEntries } from '@buster/database';
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
      await tool.onInputStart(input);
    }

    if (tool.onInputAvailable) {
      await tool.onInputAvailable(input);
    }

    const result = await tool.execute(input);

    // Verify database calls
    expect(mockUpdateMessageEntries).toHaveBeenCalled();

    // Check initial append call
    const appendCall = mockUpdateMessageEntries.mock.calls.find((call) => call[2] === 'append');
    expect(appendCall).toBeDefined();
    expect(appendCall?.[0]).toBe('test-message-123');
    expect(appendCall?.[1]).toHaveProperty('responseEntry');
    expect(appendCall?.[1]).toHaveProperty('rawLlmMessage');

    // Check update call
    const updateCall = mockUpdateMessageEntries.mock.calls.find((call) => call[2] === 'update');
    expect(updateCall).toBeDefined();
    expect(updateCall?.[0]).toBe('test-message-123');
    expect(updateCall?.[1]).toHaveProperty('responseEntry');

    // Verify the response entry has the clarifying question
    const responseEntry = updateCall?.[1].responseEntry;
    expect(responseEntry).toMatchObject({
      type: 'text',
      message: 'What specific metrics would you like to analyze?',
      is_final_message: true,
    });

    expect(result).toEqual({});
  });

  it('should handle streaming updates correctly', async () => {
    const mockContext = {
      messageId: 'test-message-stream',
      chatId: 'test-chat-stream',
    };

    const tool = createMessageUserClarifyingQuestionTool(mockContext);

    // Start streaming
    if (tool.onInputStart) {
      await tool.onInputStart({
        clarifying_question: '',
      } as MessageUserClarifyingQuestionInput);
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
        await tool.onInputDelta(chunk);
      }
    }

    // Finalize
    const completeInput: MessageUserClarifyingQuestionInput = {
      clarifying_question: 'Please provide more details about your requirements',
    };

    if (tool.onInputAvailable) {
      await tool.onInputAvailable(completeInput);
    }

    // Verify multiple update calls during streaming
    const updateCalls = mockUpdateMessageEntries.mock.calls.filter((call) => call[2] === 'update');
    expect(updateCalls.length).toBeGreaterThan(0);

    // Verify final update has complete question
    const lastUpdateCall = updateCalls[updateCalls.length - 1];
    expect(lastUpdateCall?.[1].responseEntry?.message).toBe(
      'Please provide more details about your requirements'
    );
  });

  it('should handle errors gracefully', async () => {
    // Mock database error
    mockUpdateMessageEntries.mockRejectedValueOnce(new Error('Database error'));

    const mockContext = {
      messageId: 'test-message-error',
    };

    const tool = createMessageUserClarifyingQuestionTool(mockContext);

    const input: MessageUserClarifyingQuestionInput = {
      clarifying_question: 'What is your budget?',
    };

    // Should not throw even with database error
    if (tool.onInputStart) {
      await expect(tool.onInputStart(input)).resolves.not.toThrow();
    }

    const result = await tool.execute(input);
    expect(result).toEqual({});
  });

  it('should work without messageId', async () => {
    const mockContext = {
      chatId: 'test-chat-no-message',
    };

    const tool = createMessageUserClarifyingQuestionTool(mockContext);

    const input: MessageUserClarifyingQuestionInput = {
      clarifying_question: 'Can you clarify your requirements?',
    };

    if (tool.onInputStart) {
      await tool.onInputStart(input);
    }

    if (tool.onInputAvailable) {
      await tool.onInputAvailable(input);
    }

    const result = await tool.execute(input);

    // Should not call database without messageId
    expect(mockUpdateMessageEntries).not.toHaveBeenCalled();
    expect(result).toEqual({});
  });

  it('should handle multi-line markdown questions', async () => {
    const mockContext = {
      messageId: 'test-message-markdown',
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
      await tool.onInputStart(input);
    }

    if (tool.onInputAvailable) {
      await tool.onInputAvailable(input);
    }

    await tool.execute(input);

    // Verify the markdown is preserved
    const calls = mockUpdateMessageEntries.mock.calls;
    const hasMarkdownQuestion = calls.some((call) => {
      const entry = call[1].responseEntry || call[1].rawLlmMessage;
      return entry && JSON.stringify(entry).includes('**Data Sources**');
    });

    expect(hasMarkdownQuestion).toBe(true);
  });
});
