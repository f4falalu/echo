import type { Sandbox } from '@buster/sandbox';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreateFilesToolContext, CreateFilesToolState } from './create-files-tool';
import { createCreateFilesToolDelta } from './create-files-tool-delta';
import { createCreateFilesToolFinish } from './create-files-tool-finish';
import { createCreateFilesToolStart } from './create-files-tool-start';

vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn(),
}));

vi.mock('./helpers/create-files-tool-transform-helper', () => ({
  createCreateFilesToolTransformHelper: vi.fn(() => (entry: any) => ({
    ...entry,
    type: 'tool_execution',
    args: JSON.stringify(entry.args),
    result: entry.result ? JSON.stringify(entry.result) : null,
  })),
}));

describe('create-files-tool streaming', () => {
  const mockContext: CreateFilesToolContext = {
    messageId: 'test-message-id',
    sandbox: {
      id: 'test-sandbox',
      fs: {},
    } as unknown as Sandbox,
  };

  let mockState: CreateFilesToolState;

  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      entry_id: undefined,
      args: undefined,
      files: undefined,
    };
  });

  describe('createCreateFilesToolStart', () => {
    it('should initialize state and create database entries', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      const onInputStart = createCreateFilesToolStart(mockState, mockContext);

      await onInputStart();

      // Check that entry_id was generated
      expect(mockState.entry_id).toBeDefined();
      expect(typeof mockState.entry_id).toBe('string');

      // Check that database was updated
      expect(updateMessageEntries).toHaveBeenCalledWith({
        messageId: mockContext.messageId,
        entries: [
          expect.objectContaining({
            entry_id: mockState.entry_id,
            type: 'tool_execution',
            tool_name: 'create_files',
          }),
        ],
      });
    });
  });

  describe('createCreateFilesToolDelta', () => {
    it('should process text deltas and update state', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      mockState.entry_id = 'test-entry-id';

      const onInputDelta = createCreateFilesToolDelta(mockState, mockContext);

      // Simulate streaming JSON input
      await onInputDelta({
        delta: {
          type: 'text-delta' as const,
          textDelta: '{"files": [{"path": "/test/file.txt", "content": "test content"}]',
        },
      });

      // State should be updated with partial parsing
      expect(mockState.args).toBe(
        '{"files": [{"path": "/test/file.txt", "content": "test content"}]'
      );
    });

    it('should update database when files are parsed', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      mockState.entry_id = 'test-entry-id';

      const onInputDelta = createCreateFilesToolDelta(mockState, mockContext);

      // Send complete JSON
      await onInputDelta({
        delta: {
          type: 'text-delta' as const,
          textDelta: '{"files": [{"path": "/test/file.txt", "content": "test content"}]}',
        },
      });

      // Should update database with parsed files
      expect(updateMessageEntries).toHaveBeenCalledWith({
        messageId: mockContext.messageId,
        entries: [
          expect.objectContaining({
            entry_id: 'test-entry-id',
            type: 'tool_execution',
            tool_name: 'create_files',
          }),
        ],
      });
    });

    it('should ignore non-text-delta messages', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      mockState.entry_id = 'test-entry-id';

      const onInputDelta = createCreateFilesToolDelta(mockState, mockContext);

      await onInputDelta({
        delta: {
          type: 'other-delta' as any,
          textDelta: 'some text',
        },
      });

      // Should not update args or database
      expect(mockState.args).toBeUndefined();
      expect(updateMessageEntries).not.toHaveBeenCalled();
    });

    it('should handle missing entry_id gracefully', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      // Don't set entry_id

      const onInputDelta = createCreateFilesToolDelta(mockState, mockContext);

      await onInputDelta({
        delta: {
          type: 'text-delta' as const,
          textDelta: '{"files": []}',
        },
      });

      // Should not update database without entry_id
      expect(updateMessageEntries).not.toHaveBeenCalled();
    });
  });

  describe('createCreateFilesToolFinish', () => {
    it('should update state with complete input', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      mockState.entry_id = 'test-entry-id';

      const onInputAvailable = createCreateFilesToolFinish(mockState, mockContext);

      const completeInput = {
        files: [
          { path: '/test/file1.txt', content: 'content1' },
          { path: '/test/file2.txt', content: 'content2' },
        ],
      };

      await onInputAvailable({ input: completeInput });

      // Should update state with complete files
      expect(mockState.files).toEqual(completeInput.files);

      // Should update database with final input
      expect(updateMessageEntries).toHaveBeenCalledWith({
        messageId: mockContext.messageId,
        entries: [
          expect.objectContaining({
            entry_id: 'test-entry-id',
            type: 'tool_execution',
            tool_name: 'create_files',
            args: JSON.stringify({
              files: completeInput.files,
            }),
          }),
        ],
      });
    });

    it('should handle missing entry_id gracefully', async () => {
      const { updateMessageEntries } = await import('@buster/database');
      // Don't set entry_id

      const onInputAvailable = createCreateFilesToolFinish(mockState, mockContext);

      const completeInput = {
        files: [{ path: '/test/file.txt', content: 'test content' }],
      };

      await onInputAvailable({ input: completeInput });

      // Should not update database without entry_id
      expect(updateMessageEntries).not.toHaveBeenCalled();
    });
  });
});
