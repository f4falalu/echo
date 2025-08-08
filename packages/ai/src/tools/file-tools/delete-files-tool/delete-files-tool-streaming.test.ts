import type { Sandbox } from '@buster/sandbox';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DeleteFilesToolContext, DeleteFilesToolState } from './delete-files-tool';
import { createDeleteFilesToolDelta } from './delete-files-tool-delta';
import { createDeleteFilesToolFinish } from './delete-files-tool-finish';
import { createDeleteFilesToolStart } from './delete-files-tool-start';

vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn(),
}));

vi.mock('./helpers/delete-files-tool-transform-helper', () => ({
  createDeleteFilesToolTransformHelper: vi.fn(() => (entry: any) => ({
    ...entry,
    type: 'tool_execution',
    args: JSON.stringify(entry.args),
    result: entry.result ? JSON.stringify(entry.result) : null,
  })),
}));

describe('delete-files-tool streaming', () => {
  const mockContext: DeleteFilesToolContext = {
    messageId: 'test-message-id',
    sandbox: {
      id: 'test-sandbox',
      process: {
        codeRun: vi.fn(),
      },
    } as unknown as Sandbox,
  };

  let mockState: DeleteFilesToolState;

  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      entry_id: undefined,
      args: undefined,
      paths: undefined,
    };
  });

  describe('createDeleteFilesToolStart', () => {
    it('should initialize state and create database entries', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      const onInputStart = createDeleteFilesToolStart(mockState, mockContext);

      await onInputStart();

      expect(mockState.entry_id).toBeDefined();
      expect(mockState.args).toBe('');
      expect(mockState.paths).toBeUndefined();

      expect(updateMessageEntries).toHaveBeenCalledWith({
        messageId: 'test-message-id',
        entries: expect.arrayContaining([
          expect.objectContaining({
            entry_id: mockState.entry_id,
            tool_name: 'delete_files',
            args: '{}',
            status: 'loading',
            started_at: expect.any(Date),
          }),
        ]),
      });
    });

    it('should handle errors gracefully', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      vi.mocked(updateMessageEntries).mockRejectedValueOnce(new Error('Database error'));

      const onInputStart = createDeleteFilesToolStart(mockState, mockContext);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await onInputStart();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in delete-files-tool start:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('createDeleteFilesToolDelta', () => {
    it('should accumulate text deltas and parse input', async () => {
      mockState.entry_id = 'test-entry-id';
      const onInputDelta = createDeleteFilesToolDelta(mockState, mockContext);

      await onInputDelta({
        delta: { type: 'text-delta', textDelta: '{"paths": ["' },
      });

      expect(mockState.args).toBe('{"paths": ["');
      // The optimistic parser extracts what it can from the partial JSON
      expect(mockState.paths).toEqual(['']);

      await onInputDelta({
        delta: { type: 'text-delta', textDelta: '/test/path"]}' },
      });

      expect(mockState.args).toBe('{"paths": ["/test/path"]}');
      expect(mockState.paths).toEqual(['/test/path']);
    });

    it('should update database entries when paths become available', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      mockState.entry_id = 'test-entry-id';
      const onInputDelta = createDeleteFilesToolDelta(mockState, mockContext);

      await onInputDelta({
        delta: { type: 'text-delta', textDelta: '{"paths": ["/test/path"]}' },
      });

      expect(updateMessageEntries).toHaveBeenCalledWith({
        messageId: 'test-message-id',
        entries: expect.arrayContaining([
          expect.objectContaining({
            entry_id: 'test-entry-id',
            tool_name: 'delete_files',
            args: '{"paths":["/test/path"]}',
            status: 'loading',
          }),
        ]),
      });
    });

    it('should handle partial JSON gracefully', async () => {
      mockState.entry_id = 'test-entry-id';
      const onInputDelta = createDeleteFilesToolDelta(mockState, mockContext);

      await onInputDelta({
        delta: { type: 'text-delta', textDelta: '{"paths": ["/test' },
      });

      // The optimistic parser may extract partial values, so we check for either undefined or partial
      // depending on what the parser can extract from incomplete JSON
      expect(mockState.paths).toBeDefined();
    });

    it('should skip processing if entry_id is not set', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      const onInputDelta = createDeleteFilesToolDelta(mockState, mockContext);

      await onInputDelta({
        delta: { type: 'text-delta', textDelta: '{"paths": []}' },
      });

      expect(updateMessageEntries).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      vi.mocked(updateMessageEntries).mockRejectedValueOnce(new Error('Database error'));

      mockState.entry_id = 'test-entry-id';
      const onInputDelta = createDeleteFilesToolDelta(mockState, mockContext);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await onInputDelta({
        delta: { type: 'text-delta', textDelta: '{"paths": ["/test"]}' },
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in delete-files-tool delta:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('createDeleteFilesToolFinish', () => {
    it('should finalize state with complete input', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      mockState.entry_id = 'test-entry-id';
      const onInputAvailable = createDeleteFilesToolFinish(mockState, mockContext);

      const input = {
        paths: ['/test/path1', '/test/path2'],
      };

      await onInputAvailable({ input });

      expect(updateMessageEntries).toHaveBeenCalledWith({
        messageId: 'test-message-id',
        entries: expect.arrayContaining([
          expect.objectContaining({
            entry_id: 'test-entry-id',
            tool_name: 'delete_files',
            args: '{"paths":["/test/path1","/test/path2"]}',
            status: 'loading',
          }),
        ]),
      });
    });

    it('should skip processing if entry_id is not set', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      const onInputAvailable = createDeleteFilesToolFinish(mockState, mockContext);

      await onInputAvailable({
        input: { paths: ['/test'] },
      });

      expect(updateMessageEntries).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      vi.mocked(updateMessageEntries).mockRejectedValueOnce(new Error('Database error'));

      mockState.entry_id = 'test-entry-id';
      const onInputAvailable = createDeleteFilesToolFinish(mockState, mockContext);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await onInputAvailable({
        input: { paths: ['/test'] },
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in delete-files-tool finish:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });
});
