import type { Sandbox } from '@buster/sandbox';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ListFilesToolContext, ListFilesToolState } from './list-files-tool';
import { createListFilesToolDelta } from './list-files-tool-delta';
import { createListFilesToolFinish } from './list-files-tool-finish';
import { createListFilesToolStart } from './list-files-tool-start';

vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn(),
}));

vi.mock('./helpers/list-files-tool-transform-helper', () => ({
  createListFilesToolTransformHelper: vi.fn(() => (entry: any) => ({
    ...entry,
    type: 'tool_execution',
    args: JSON.stringify(entry.args),
    result: entry.result ? JSON.stringify(entry.result) : null,
  })),
}));

describe('list-files-tool streaming', () => {
  const mockContext: ListFilesToolContext = {
    messageId: 'test-message-id',
    sandbox: {
      id: 'test-sandbox',
      process: {
        executeCommand: vi.fn(),
      },
    } as unknown as Sandbox,
  };

  let mockState: ListFilesToolState;

  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      entry_id: undefined,
      args: undefined,
      paths: undefined,
      options: undefined,
    };
  });

  describe('createListFilesToolStart', () => {
    it('should initialize state and create database entries', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      const onInputStart = createListFilesToolStart(mockState, mockContext);

      await onInputStart();

      expect(mockState.entry_id).toBeDefined();
      expect(mockState.args).toBe('');
      expect(mockState.paths).toBeUndefined();
      expect(mockState.options).toBeUndefined();

      expect(updateMessageEntries).toHaveBeenCalledWith({
        messageId: 'test-message-id',
        entries: [
          {
            entry_id: mockState.entry_id,
            tool_name: 'list_files',
            type: 'tool_execution',
            args: '{}',
            result: null,
            status: 'loading',
            started_at: expect.any(Date),
          },
        ],
      });
    });

    it('should handle errors gracefully', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      vi.mocked(updateMessageEntries).mockRejectedValueOnce(new Error('Database error'));

      const onInputStart = createListFilesToolStart(mockState, mockContext);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await onInputStart();

      expect(consoleSpy).toHaveBeenCalledWith('Error in list-files-tool start:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('createListFilesToolDelta', () => {
    it('should accumulate text deltas and parse input', async () => {
      mockState.entry_id = 'test-entry-id';
      const onInputDelta = createListFilesToolDelta(mockState, mockContext);

      await onInputDelta({
        delta: { type: 'text-delta', textDelta: '{"paths": ["' },
      });

      expect(mockState.args).toBe('{"paths": ["');
      expect(mockState.paths).toEqual(['']);

      await onInputDelta({
        delta: { type: 'text-delta', textDelta: '/test/path"], "options": {"depth": 2}}' },
      });

      expect(mockState.args).toBe('{"paths": ["/test/path"], "options": {"depth": 2}}');
      expect(mockState.paths).toEqual(['/test/path']);
      expect(mockState.options).toEqual({ depth: 2 });
    });

    it('should update database entries when values become available', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      mockState.entry_id = 'test-entry-id';
      const onInputDelta = createListFilesToolDelta(mockState, mockContext);

      await onInputDelta({
        delta: { type: 'text-delta', textDelta: '{"paths": ["/test/path"]}' },
      });

      expect(updateMessageEntries).toHaveBeenCalledWith({
        messageId: 'test-message-id',
        entries: [
          {
            entry_id: 'test-entry-id',
            tool_name: 'list_files',
            type: 'tool_execution',
            args: '{"paths":["/test/path"]}',
            result: null,
            status: 'loading',
            started_at: expect.any(Date),
          },
        ],
      });
    });

    it('should handle partial JSON gracefully', async () => {
      mockState.entry_id = 'test-entry-id';
      const onInputDelta = createListFilesToolDelta(mockState, mockContext);

      await onInputDelta({
        delta: { type: 'text-delta', textDelta: '{"paths": ["/test' },
      });

      expect(mockState.paths).toEqual(['/test']);
    });

    it('should skip processing if entry_id is not set', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      const onInputDelta = createListFilesToolDelta(mockState, mockContext);

      await onInputDelta({
        delta: { type: 'text-delta', textDelta: '{"paths": []}' },
      });

      expect(updateMessageEntries).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      vi.mocked(updateMessageEntries).mockRejectedValueOnce(new Error('Database error'));

      mockState.entry_id = 'test-entry-id';
      const onInputDelta = createListFilesToolDelta(mockState, mockContext);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await onInputDelta({
        delta: { type: 'text-delta', textDelta: '{"paths": ["/test"]}' },
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error in list-files-tool delta:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('createListFilesToolFinish', () => {
    it('should finalize state with complete input', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      mockState.entry_id = 'test-entry-id';
      const onInputAvailable = createListFilesToolFinish(mockState, mockContext);

      const input = {
        paths: ['/test/path'],
        options: { depth: 2, all: true },
      };

      await onInputAvailable({ input });

      expect(updateMessageEntries).toHaveBeenCalledWith({
        messageId: 'test-message-id',
        entries: [
          {
            entry_id: 'test-entry-id',
            tool_name: 'list_files',
            type: 'tool_execution',
            args: '{"paths":["/test/path"],"options":{"depth":2,"all":true}}',
            result: null,
            status: 'loading',
            started_at: expect.any(Date),
          },
        ],
      });
    });

    it('should skip processing if entry_id is not set', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      const onInputAvailable = createListFilesToolFinish(mockState, mockContext);

      await onInputAvailable({
        input: { paths: ['/test'] },
      });

      expect(updateMessageEntries).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      vi.mocked(updateMessageEntries).mockRejectedValueOnce(new Error('Database error'));

      mockState.entry_id = 'test-entry-id';
      const onInputAvailable = createListFilesToolFinish(mockState, mockContext);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await onInputAvailable({
        input: { paths: ['/test'] },
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in list-files-tool finish:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });
});
