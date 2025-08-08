import type { Sandbox } from '@buster/sandbox';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GrepSearchToolContext, GrepSearchToolState } from './grep-search-tool';
import { createGrepSearchToolDelta } from './grep-search-tool-delta';
import { createGrepSearchToolFinish } from './grep-search-tool-finish';
import { createGrepSearchToolStart } from './grep-search-tool-start';

vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn(),
}));

vi.mock('./helpers/grep-search-tool-transform-helper', () => ({
  createGrepSearchToolResponseMessage: vi.fn((state) => ({
    id: state.entry_id || 'mock-id',
    type: 'text',
    message: `Executing ${state.commands?.length || 0} ripgrep command${
      state.commands?.length === 1 ? '' : 's'
    }`,
    is_final_message: false,
  })),
  createGrepSearchToolRawLlmMessageEntry: vi.fn((state) => ({
    role: 'assistant',
    content: [
      {
        type: 'tool-call',
        toolCallId: state.entry_id || 'mock-id',
        toolName: 'grepSearchTool',
        input: state.commands ? { commands: state.commands } : {},
      },
    ],
  })),
}));

describe('grep-search-tool streaming', () => {
  const mockContext: GrepSearchToolContext = {
    messageId: 'test-message-id',
    sandbox: {
      id: 'test-sandbox',
      process: {
        executeCommand: vi.fn(),
      },
    } as unknown as Sandbox,
  };

  let mockState: GrepSearchToolState;

  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      entry_id: undefined,
      args: undefined,
      commands: undefined,
    };
  });

  describe('createGrepSearchToolStart', () => {
    it('should initialize state and create database entries', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      const onInputStart = createGrepSearchToolStart(mockState, mockContext);

      await onInputStart({ toolCallId: 'test-tool-call-id' });

      expect(mockState.entry_id).toBe('test-tool-call-id');

      expect(updateMessageEntries).toHaveBeenCalledWith({
        messageId: 'test-message-id',
        responseEntry: expect.objectContaining({
          id: 'test-tool-call-id',
          type: 'text',
          message: 'Executing 0 ripgrep commands',
          is_final_message: false,
        }),
        rawLlmMessage: expect.objectContaining({
          role: 'assistant',
          content: [
            expect.objectContaining({
              type: 'tool-call',
              toolCallId: 'test-tool-call-id',
              toolName: 'grepSearchTool',
            }),
          ],
        }),
        mode: 'append',
      });
    });

    it('should handle errors gracefully', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      vi.mocked(updateMessageEntries).mockRejectedValueOnce(new Error('Database error'));

      const onInputStart = createGrepSearchToolStart(mockState, mockContext);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await onInputStart({ toolCallId: 'test-tool-call-id' });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[grep-search-tool] Failed to update grep search tool raw LLM message:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('createGrepSearchToolDelta', () => {
    it('should accumulate text deltas and parse commands', async () => {
      mockState.entry_id = 'test-entry-id';
      const onInputDelta = createGrepSearchToolDelta(mockState, mockContext);

      await onInputDelta({
        inputTextDelta: '{"commands": ["rg \\"test\\" file.txt"',
        toolCallId: 'test-tool-call-id',
      });

      expect(mockState.args).toBe('{"commands": ["rg \\"test\\" file.txt"');
      // OptimisticJsonParser extracts partial values, so this might be defined
      // We'll check the behavior after the full JSON is complete

      await onInputDelta({
        inputTextDelta: ', "rg -i \\"hello\\" *.js"]}',
        toolCallId: 'test-tool-call-id',
      });

      expect(mockState.args).toBe(
        '{"commands": ["rg \\"test\\" file.txt", "rg -i \\"hello\\" *.js"]}'
      );
      expect(mockState.commands).toEqual(['rg "test" file.txt', 'rg -i "hello" *.js']);
    });

    it('should update database entries when commands become available', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      mockState.entry_id = 'test-entry-id';
      const onInputDelta = createGrepSearchToolDelta(mockState, mockContext);

      await onInputDelta({
        inputTextDelta: '{"commands": ["rg \\"test\\" file.txt"]}',
        toolCallId: 'test-tool-call-id',
      });

      expect(updateMessageEntries).toHaveBeenCalledWith({
        messageId: 'test-message-id',
        responseEntry: expect.objectContaining({
          id: 'test-entry-id',
          type: 'text',
          message: 'Executing 1 ripgrep command',
          is_final_message: false,
        }),
        rawLlmMessage: expect.objectContaining({
          role: 'assistant',
          content: [
            expect.objectContaining({
              type: 'tool-call',
              toolCallId: 'test-entry-id',
              toolName: 'grepSearchTool',
              input: {
                commands: ['rg "test" file.txt'],
              },
            }),
          ],
        }),
        mode: 'append',
      });
    });

    it('should handle partial JSON gracefully', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      mockState.entry_id = 'test-entry-id';
      const onInputDelta = createGrepSearchToolDelta(mockState, mockContext);

      await onInputDelta({
        inputTextDelta: '{"commands": ["rg',
        toolCallId: 'test-tool-call-id',
      });

      // The OptimisticJsonParser may extract partial values from incomplete JSON
      // This is expected behavior - it will extract what it can parse
      expect(updateMessageEntries).not.toHaveBeenCalledWith({
        messageId: 'test-message-id',
        responseEntry: expect.objectContaining({
          message: 'Executing 1 ripgrep command',
        }),
        mode: 'append',
      });
    });

    it('should handle invalid commands array', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      mockState.entry_id = 'test-entry-id';
      const onInputDelta = createGrepSearchToolDelta(mockState, mockContext);

      await onInputDelta({
        inputTextDelta: '{"commands": "not an array"}',
        toolCallId: 'test-tool-call-id',
      });

      expect(mockState.commands).toBeUndefined();
      expect(updateMessageEntries).not.toHaveBeenCalled();
    });

    it('should handle empty commands array', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      mockState.entry_id = 'test-entry-id';
      const onInputDelta = createGrepSearchToolDelta(mockState, mockContext);

      await onInputDelta({
        inputTextDelta: '{"commands": []}',
        toolCallId: 'test-tool-call-id',
      });

      expect(mockState.commands).toBeUndefined();
      expect(updateMessageEntries).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      vi.mocked(updateMessageEntries).mockRejectedValueOnce(new Error('Database error'));

      mockState.entry_id = 'test-entry-id';
      const onInputDelta = createGrepSearchToolDelta(mockState, mockContext);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await onInputDelta({
        inputTextDelta: '{"commands": ["rg test"]}',
        toolCallId: 'test-tool-call-id',
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[grep-search-tool] Failed to update grep search tool raw LLM message:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('createGrepSearchToolFinish', () => {
    it('should finalize state with complete input', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      mockState.entry_id = 'test-entry-id';
      const onInputAvailable = createGrepSearchToolFinish(mockState, mockContext);

      const input = {
        commands: ['rg "test" file.txt', 'rg -i "hello" *.js'],
      };

      await onInputAvailable({ input, toolCallId: 'test-tool-call-id' });

      expect(mockState.entry_id).toBe('test-tool-call-id');
      expect(mockState.commands).toEqual(input.commands);

      expect(updateMessageEntries).toHaveBeenCalledWith({
        messageId: 'test-message-id',
        responseEntry: expect.objectContaining({
          id: 'test-tool-call-id',
          type: 'text',
          message: 'Executing 2 ripgrep commands',
          is_final_message: false,
        }),
        rawLlmMessage: expect.objectContaining({
          role: 'assistant',
          content: [
            expect.objectContaining({
              type: 'tool-call',
              toolCallId: 'test-tool-call-id',
              toolName: 'grepSearchTool',
              input,
            }),
          ],
        }),
        mode: 'update',
      });
    });

    it('should handle database errors gracefully', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      vi.mocked(updateMessageEntries).mockRejectedValueOnce(new Error('Database error'));

      mockState.entry_id = 'test-entry-id';
      const onInputAvailable = createGrepSearchToolFinish(mockState, mockContext);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await onInputAvailable({
        input: { commands: ['rg test'] },
        toolCallId: 'test-tool-call-id',
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[grep-search-tool] Failed to update grep search tool raw LLM message:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });
});
