import type { ModelMessage, ToolCallOptions } from 'ai';
import { describe, expect, test, vi } from 'vitest';
import type { DoneToolContext, DoneToolInput, DoneToolState } from './done-tool';
import { createDoneToolDelta } from './done-tool-delta';
import { createDoneToolFinish } from './done-tool-finish';
import { createDoneToolStart } from './done-tool-start';

vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn().mockResolvedValue({ success: true }),
}));

describe('Done Tool Streaming Tests', () => {
  const mockContext: DoneToolContext = {
    messageId: 'test-message-id-123',
    workflowStartTime: Date.now(),
  };

  describe('createDoneToolStart', () => {
    test('should initialize state with entry_id on start', async () => {
      const state: DoneToolState = {
        toolCallId: undefined,
        args: undefined,
        finalResponse: undefined,
      };

      const startHandler = createDoneToolStart(state, mockContext);
      const options: ToolCallOptions = {
        toolCallId: 'tool-call-123',
        messages: [],
      };

      await startHandler(options);

      expect(state.toolCallId).toBe('tool-call-123');
    });

    test('should handle start with messages containing file tool calls', async () => {
      const state: DoneToolState = {
        toolCallId: undefined,
        args: undefined,
        finalResponse: undefined,
      };

      const startHandler = createDoneToolStart(state, mockContext);

      const messages: ModelMessage[] = [
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call' as const,
              toolCallId: 'file-tool-123',
              toolName: 'create-metrics-file',
              input: {
                files: [{ name: 'test.yml', yml_content: 'test content' }],
              },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId: 'file-tool-123',
              toolName: 'create-metrics-file',
              output: {
                type: 'json',
                value: [
                  {
                    id: 'file-123',
                    name: 'test.yml',
                    file_type: 'metric',
                    yml_content: 'test content',
                  },
                ],
              },
            },
          ],
        },
      ];

      const options: ToolCallOptions & { messages?: ModelMessage[] } = {
        toolCallId: 'tool-call-123',
        messages: messages,
      };

      await startHandler(options);

      expect(state.toolCallId).toBe('tool-call-123');
    });

    test('should handle start without messages', async () => {
      const state: DoneToolState = {
        toolCallId: undefined,
        args: undefined,
        finalResponse: undefined,
      };

      const startHandler = createDoneToolStart(state, mockContext);
      const options: ToolCallOptions = {
        toolCallId: 'tool-call-456',
        messages: [],
      };

      await startHandler(options);

      expect(state.toolCallId).toBe('tool-call-456');
    });

    test('should handle context without messageId', async () => {
      const contextWithoutMessageId: DoneToolContext = {
        messageId: '',
        workflowStartTime: Date.now(),
      };
      const state: DoneToolState = {
        toolCallId: undefined,
        args: undefined,
        finalResponse: undefined,
      };

      const startHandler = createDoneToolStart(state, contextWithoutMessageId);
      const options: ToolCallOptions = {
        toolCallId: 'tool-call-789',
        messages: [],
      };

      await expect(startHandler(options)).resolves.not.toThrow();
      expect(state.toolCallId).toBe('tool-call-789');
    });
  });

  describe('createDoneToolDelta', () => {
    test('should accumulate text deltas to args', async () => {
      const state: DoneToolState = {
        toolCallId: 'test-entry',
        args: '',
        finalResponse: undefined,
      };

      const deltaHandler = createDoneToolDelta(state, mockContext);

      await deltaHandler({
        inputTextDelta: '{"final_',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.args).toBe('{"final_');

      await deltaHandler({
        inputTextDelta: 'response": "Hello',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.args).toBe('{"final_response": "Hello');
    });

    test('should extract partial final_response from incomplete JSON', async () => {
      const state: DoneToolState = {
        toolCallId: 'test-entry',
        args: '',
        finalResponse: undefined,
      };

      const deltaHandler = createDoneToolDelta(state, mockContext);

      await deltaHandler({
        inputTextDelta: '{"final_response": "This is a partial response that is still being',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.args).toBe('{"final_response": "This is a partial response that is still being');
      expect(state.finalResponse).toBe('This is a partial response that is still being');
    });

    test('should handle complete JSON in delta', async () => {
      const state: DoneToolState = {
        toolCallId: 'test-entry',
        args: '',
        finalResponse: undefined,
      };

      const deltaHandler = createDoneToolDelta(state, mockContext);

      await deltaHandler({
        inputTextDelta: '{"final_response": "Complete response message"}',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.args).toBe('{"final_response": "Complete response message"}');
      expect(state.finalResponse).toBe('Complete response message');
    });

    test('should handle markdown content in final_response', async () => {
      const state: DoneToolState = {
        toolCallId: 'test-entry',
        args: '',
        finalResponse: undefined,
      };

      const deltaHandler = createDoneToolDelta(state, mockContext);

      const markdownContent = `## Summary

- Point 1
- Point 2

**Bold text**`;
      const jsonInput = JSON.stringify({ final_response: markdownContent });
      await deltaHandler({
        inputTextDelta: jsonInput,
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.finalResponse).toBe(markdownContent);
    });

    test('should handle escaped characters in JSON', async () => {
      const state: DoneToolState = {
        toolCallId: 'test-entry',
        args: '',
        finalResponse: undefined,
      };

      const deltaHandler = createDoneToolDelta(state, mockContext);

      await deltaHandler({
        inputTextDelta: '{"final_response": "Line 1\\nLine 2\\n\\"Quoted text\\""}',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.finalResponse).toBe('Line 1\nLine 2\n"Quoted text"');
    });

    test('should not update state when no final_response is extracted', async () => {
      const state: DoneToolState = {
        toolCallId: 'test-entry',
        args: '',
        finalResponse: undefined,
      };

      const deltaHandler = createDoneToolDelta(state, mockContext);

      await deltaHandler({
        inputTextDelta: '{"other_field": "value"}',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.args).toBe('{"other_field": "value"}');
      expect(state.finalResponse).toBeUndefined();
    });

    test('should handle empty final_response gracefully', async () => {
      const state: DoneToolState = {
        toolCallId: 'test-entry',
        args: '',
        finalResponse: undefined,
      };

      const deltaHandler = createDoneToolDelta(state, mockContext);

      await deltaHandler({
        inputTextDelta: '{"final_response": ""}',
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.args).toBe('{"final_response": ""}');
      expect(state.finalResponse).toBeUndefined();
    });
  });

  describe('createDoneToolFinish', () => {
    test('should update state with final input on finish', async () => {
      const state: DoneToolState = {
        toolCallId: undefined,
        args: '{"final_response": "Final message"}',
        finalResponse: 'Final message',
      };

      const finishHandler = createDoneToolFinish(state, mockContext);

      const input: DoneToolInput = {
        finalResponse: 'This is the final response message',
      };

      await finishHandler({
        input,
        toolCallId: 'tool-call-123',
        messages: [],
      });

      expect(state.toolCallId).toBe('tool-call-123');
    });

    test('should handle finish without prior entry_id', async () => {
      const state: DoneToolState = {
        toolCallId: undefined,
        args: undefined,
        finalResponse: undefined,
      };

      const finishHandler = createDoneToolFinish(state, mockContext);

      const input: DoneToolInput = {
        finalResponse: 'Response without prior start',
      };

      await finishHandler({
        input,
        toolCallId: 'tool-call-456',
        messages: [],
      });

      expect(state.toolCallId).toBe('tool-call-456');
    });

    test('should handle markdown formatted final response', async () => {
      const state: DoneToolState = {
        toolCallId: undefined,
        args: undefined,
        finalResponse: undefined,
      };

      const finishHandler = createDoneToolFinish(state, mockContext);

      const markdownResponse = `
## Analysis Complete

The following items were processed:
- Item 1: Successfully analyzed
- Item 2: Completed with warnings
- Item 3: **Failed** - requires attention

### Next Steps
1. Review the failed items
2. Update configuration
3. Re-run the analysis
`;

      const input: DoneToolInput = {
        finalResponse: markdownResponse,
      };

      await finishHandler({
        input,
        toolCallId: 'tool-call-789',
        messages: [],
      });

      expect(state.toolCallId).toBe('tool-call-789');
    });
  });

  describe('Type Safety Tests', () => {
    test('should enforce DoneToolContext type requirements', () => {
      const validContext: DoneToolContext = {
        messageId: 'message-123',
        workflowStartTime: Date.now(),
      };

      const extendedContext = {
        messageId: 'message-456',
        workflowStartTime: Date.now(),
        additionalField: 'extra-data',
      };

      const state: DoneToolState = {
        toolCallId: undefined,
        args: undefined,
        finalResponse: undefined,
      };

      const handler1 = createDoneToolStart(state, validContext);
      const handler2 = createDoneToolStart(state, extendedContext);

      expect(handler1).toBeDefined();
      expect(handler2).toBeDefined();
    });

    test('should maintain state type consistency through streaming lifecycle', async () => {
      const state: DoneToolState = {
        toolCallId: undefined,
        args: undefined,
        finalResponse: undefined,
      };

      const startHandler = createDoneToolStart(state, mockContext);
      const deltaHandler = createDoneToolDelta(state, mockContext);
      const finishHandler = createDoneToolFinish(state, mockContext);

      await startHandler({ toolCallId: 'test-123', messages: [] });
      expect(state.toolCallId).toBeTypeOf('string');

      await deltaHandler({
        inputTextDelta: '{"final_response": "Testing"}',
        toolCallId: 'test-123',
        messages: [],
      });
      expect(state.args).toBeTypeOf('string');
      expect(state.finalResponse).toBeTypeOf('string');

      const input: DoneToolInput = {
        finalResponse: 'Final test',
      };
      await finishHandler({ input, toolCallId: 'test-123', messages: [] });
      expect(state.toolCallId).toBeTypeOf('string');
    });
  });

  describe('Streaming Flow Integration', () => {
    test('should handle complete streaming flow from start to finish', async () => {
      const state: DoneToolState = {
        toolCallId: undefined,
        args: undefined,
        finalResponse: undefined,
      };

      const startHandler = createDoneToolStart(state, mockContext);
      const deltaHandler = createDoneToolDelta(state, mockContext);
      const finishHandler = createDoneToolFinish(state, mockContext);

      const toolCallId = 'streaming-test-123';

      await startHandler({ toolCallId, messages: [] });
      expect(state.toolCallId).toBe(toolCallId);

      const chunks = [
        '{"final_',
        'response": "This ',
        'is a streaming ',
        'response that comes ',
        'in multiple chunks',
        '"}',
      ];

      for (const chunk of chunks) {
        await deltaHandler({
          inputTextDelta: chunk,
          toolCallId,
          messages: [],
        });
      }

      expect(state.args).toBe(
        '{"final_response": "This is a streaming response that comes in multiple chunks"}'
      );
      expect(state.finalResponse).toBe(
        'This is a streaming response that comes in multiple chunks'
      );

      const input: DoneToolInput = {
        finalResponse: 'This is a streaming response that comes in multiple chunks',
      };
      await finishHandler({ input, toolCallId, messages: [] });

      expect(state.toolCallId).toBe(toolCallId);
    });

    test('should handle streaming with special characters and formatting', async () => {
      const state: DoneToolState = {
        toolCallId: undefined,
        args: undefined,
        finalResponse: undefined,
      };

      const deltaHandler = createDoneToolDelta(state, mockContext);

      const chunks = [
        '{"final_response": "',
        '## Results\\n\\n',
        '- Success: 90%\\n',
        '- Failed: 10%\\n\\n',
        '**Note:** Review failed items',
        '"}',
      ];

      let accumulated = '';
      for (const chunk of chunks) {
        accumulated += chunk;
        await deltaHandler({
          inputTextDelta: chunk,
          toolCallId: 'format-test',
          messages: [],
        });
      }

      expect(state.finalResponse).toBe(
        '## Results\n\n- Success: 90%\n- Failed: 10%\n\n**Note:** Review failed items'
      );
    });
  });
});
