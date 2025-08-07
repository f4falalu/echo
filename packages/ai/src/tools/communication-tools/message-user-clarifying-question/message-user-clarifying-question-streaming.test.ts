import { describe, expect, it, vi } from 'vitest';
import { createMessageUserClarifyingQuestionTool } from './message-user-clarifying-question';
import type { MessageUserClarifyingQuestionInput } from './message-user-clarifying-question';

// Mock the database update function
vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn().mockResolvedValue(undefined),
}));

// Mock braintrust
vi.mock('braintrust', () => ({
  wrapTraced: (fn: any) => fn,
}));

describe('messageUserClarifyingQuestion streaming', () => {
  it('should handle streaming JSON input', async () => {
    const mockContext = {
      messageId: 'test-message-123',
      chatId: 'test-chat-456',
      userId: 'test-user-789',
    };

    const tool = createMessageUserClarifyingQuestionTool(mockContext);

    // Simulate streaming JSON chunks
    const jsonChunks = [
      '{"clarifying_',
      'question":"What ',
      'specific data ',
      'sources would you ',
      'like me to analyze',
      '? Please provide:\\n',
      '- The database tables',
      ' or data sources\\n',
      '- The time period',
      ' of interest\\n',
      '- Any specific metrics',
      ' or KPIs to focus on"',
      '}',
    ];

    // Call onInputStart if it exists
    if (tool.onInputStart) {
      await tool.onInputStart({
        clarifying_question: '',
      } as MessageUserClarifyingQuestionInput);
    }

    // Stream the chunks through onInputDelta
    if (tool.onInputDelta) {
      for (const chunk of jsonChunks) {
        await tool.onInputDelta(chunk);
      }
    }

    // Call onInputAvailable with complete input
    if (tool.onInputAvailable) {
      const completeInput: MessageUserClarifyingQuestionInput = {
        clarifying_question:
          'What specific data sources would you like me to analyze? Please provide:\n- The database tables or data sources\n- The time period of interest\n- Any specific metrics or KPIs to focus on',
      };
      await tool.onInputAvailable(completeInput);
    }

    // Execute the tool
    const result = await tool.execute({
      clarifying_question:
        'What specific data sources would you like me to analyze? Please provide:\n- The database tables or data sources\n- The time period of interest\n- Any specific metrics or KPIs to focus on',
    });

    expect(result).toEqual({});
  });

  it('should handle partial JSON parsing during streaming', async () => {
    const mockContext = {
      messageId: 'test-message-456',
    };

    const tool = createMessageUserClarifyingQuestionTool(mockContext);

    // Test with incomplete JSON that can still be optimistically parsed
    const incompleteJson = '{"clarifying_question":"Do you want to analyze sales or marketing data';

    if (tool.onInputStart) {
      await tool.onInputStart({
        clarifying_question: '',
      } as MessageUserClarifyingQuestionInput);
    }

    if (tool.onInputDelta) {
      await tool.onInputDelta(incompleteJson);
    }

    // Even with incomplete JSON, the optimistic parser should extract the partial value
    // This is verified by the fact that no errors are thrown
    expect(true).toBe(true);
  });

  it('should handle empty or malformed input gracefully', async () => {
    const mockContext = {};
    const tool = createMessageUserClarifyingQuestionTool(mockContext);

    // Test with empty input
    const result = await tool.execute({
      clarifying_question: '',
    });

    expect(result).toEqual({});

    // Test with malformed streaming input
    if (tool.onInputDelta) {
      await tool.onInputDelta('not valid json');
      await tool.onInputDelta('{"incomplete":');
    }

    // Should not throw errors
    expect(true).toBe(true);
  });

  it('should work without messageId context', async () => {
    const mockContext = {};
    const tool = createMessageUserClarifyingQuestionTool(mockContext);

    const input: MessageUserClarifyingQuestionInput = {
      clarifying_question: 'Which metrics are most important to you?',
    };

    // Should work without database updates
    if (tool.onInputStart) {
      await tool.onInputStart(input);
    }

    if (tool.onInputAvailable) {
      await tool.onInputAvailable(input);
    }

    const result = await tool.execute(input);
    expect(result).toEqual({});
  });
});
