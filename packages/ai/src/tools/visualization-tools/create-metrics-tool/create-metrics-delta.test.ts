import { updateMessageFields } from '@buster/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCreateMetricsDelta } from './create-metrics-delta';
import type { CreateMetricsInput, CreateMetricsState } from './create-metrics-tool';

// Mock the database module
vi.mock('@buster/database', () => ({
  updateMessageFields: vi.fn(),
}));

describe('createCreateMetricsDelta', () => {
  const mockContext = {
    userId: 'user-123',
    chatId: 'chat-456',
    dataSourceId: 'ds-789',
    dataSourceSyntax: 'postgresql',
    organizationId: 'org-abc',
    messageId: 'msg-xyz',
  };

  let state: CreateMetricsState;

  beforeEach(() => {
    vi.clearAllMocks();
    state = {
      argsText: '',
      files: [],
      messageId: mockContext.messageId,
      toolCallId: 'tool-123',
      reasoningEntryId: 'reasoning-456',
    };
  });

  describe('string delta handling', () => {
    it('should accumulate text deltas', async () => {
      const handler = createCreateMetricsDelta(mockContext, state);

      await handler('{"files":[');
      expect(state.argsText).toBe('{"files":[');

      await handler('{"name":"metric1",');
      expect(state.argsText).toBe('{"files":[{"name":"metric1",');
    });

    it('should parse partial JSON and extract files', async () => {
      const handler = createCreateMetricsDelta(mockContext, state);

      // Simulate streaming JSON
      await handler('{"files":[{"name":"metric1","yml_content":"content1"}');

      expect(state.files).toHaveLength(1);
      expect(state.files[0]).toEqual({
        name: 'metric1',
        yml_content: 'content1',
        status: 'processing',
      });
    });

    it('should handle multiple files in streaming JSON', async () => {
      const handler = createCreateMetricsDelta(mockContext, state);

      // Stream in multiple files - first complete file
      await handler('{"files":[{"name":"metric1","yml_content":"content1"}');
      expect(state.files).toHaveLength(1);

      // Stream in second file by accumulating more text
      state.argsText = '{"files":[{"name":"metric1","yml_content":"content1"},';
      await handler('{"name":"metric2","yml_content":"content2"}');
      
      // Now both files should be present
      expect(state.files).toHaveLength(2);
      expect(state.files[1]).toEqual({
        name: 'metric2',
        yml_content: 'content2',
        status: 'processing',
      });
    });

    it('should update existing files when content changes', async () => {
      const handler = createCreateMetricsDelta(mockContext, state);

      // Add initial file with just name
      await handler('{"files":[{"name":"metric1"}]}');
      expect(state.files[0].yml_content).toBe('');

      // Reset args text and update with content
      state.argsText = '';
      await handler('{"files":[{"name":"metric1","yml_content":"updated content"}]}');
      expect(state.files[0].yml_content).toBe('updated content');
    });

    it('should update database with progress when messageId and reasoningEntryId exist', async () => {
      const handler = createCreateMetricsDelta(mockContext, state);

      await handler('{"files":[{"name":"metric1","yml_content":"content1"}]}');

      expect(updateMessageFields).toHaveBeenCalledWith(
        'msg-xyz',
        expect.objectContaining({
          reasoning: expect.arrayContaining([
            expect.objectContaining({
              id: 'tool-123',
              type: 'files',
              status: 'loading',
            }),
          ]),
        })
      );
    });

    it('should not update database when messageId is missing', async () => {
      const contextWithoutMessageId = {
        ...mockContext,
        messageId: undefined,
      };
      const handler = createCreateMetricsDelta(contextWithoutMessageId, state);

      await handler('{"files":[{"name":"metric1","yml_content":"content1"}]}');

      expect(updateMessageFields).not.toHaveBeenCalled();
    });

    it('should not update database when reasoningEntryId is missing', async () => {
      state.reasoningEntryId = undefined;
      const handler = createCreateMetricsDelta(mockContext, state);

      await handler('{"files":[{"name":"metric1","yml_content":"content1"}]}');

      expect(updateMessageFields).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(updateMessageFields).mockRejectedValue(new Error('Database error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const handler = createCreateMetricsDelta(mockContext, state);
      await handler('{"files":[{"name":"metric1","yml_content":"content1"}]}');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[create-metrics] Failed to update streaming progress',
        expect.objectContaining({
          messageId: 'msg-xyz',
          error: 'Database error',
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('object delta handling', () => {
    it('should handle complete input object', async () => {
      const handler = createCreateMetricsDelta(mockContext, state);

      const input: Partial<CreateMetricsInput> = {
        files: [
          { name: 'metric1', yml_content: 'content1' },
          { name: 'metric2', yml_content: 'content2' },
        ],
      };

      await handler(input);

      expect(state.parsedArgs).toEqual(input);
      expect(state.files).toHaveLength(2);
      expect(state.files[0]).toEqual({
        name: 'metric1',
        yml_content: 'content1',
        status: 'processing',
      });
    });

    it('should handle partial input object', async () => {
      const handler = createCreateMetricsDelta(mockContext, state);

      const input: Partial<CreateMetricsInput> = {};
      await handler(input);

      expect(state.files).toHaveLength(0);
    });
  });

  describe('logging', () => {
    it('should log delta processing information', async () => {
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const handler = createCreateMetricsDelta(mockContext, state);
      await handler('{"files":[{"name":"metric1","yml_content":"content1"}]}');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[create-metrics] Input delta processed',
        expect.objectContaining({
          hasFiles: true,
          fileCount: 1,
          processedCount: 1,
          messageId: 'msg-xyz',
          timestamp: expect.any(String),
        })
      );

      consoleInfoSpy.mockRestore();
    });

    it('should log streaming progress updates', async () => {
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const handler = createCreateMetricsDelta(mockContext, state);
      await handler('{"files":[{"name":"metric1","yml_content":"content1"}]}');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[create-metrics] Updating database with streaming progress',
        expect.objectContaining({
          messageId: 'msg-xyz',
          progressMessage: 'Processed 1 metric',
          fileCount: 1,
          processedCount: 1,
        })
      );

      consoleInfoSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle malformed JSON gracefully', async () => {
      const handler = createCreateMetricsDelta(mockContext, state);

      // This should not throw
      await handler('{"files":[{malformed json');

      // State should still be updated with what could be parsed
      expect(state.argsText).toBe('{"files":[{malformed json');
    });

    it('should handle empty string delta', async () => {
      const handler = createCreateMetricsDelta(mockContext, state);

      await handler('');

      expect(state.argsText).toBe('');
      expect(state.files).toHaveLength(0);
    });

    it('should filter out undefined entries in files array', async () => {
      const handler = createCreateMetricsDelta(mockContext, state);
      state.toolCallId = 'tool-123';
      state.reasoningEntryId = 'reasoning-456';

      // Create sparse array with undefined entries
      state.files = [
        { name: 'metric1', yml_content: 'content1', status: 'processing' },
        undefined as any,
        { name: 'metric2', yml_content: 'content2', status: 'processing' },
      ];

      // Trigger an update with valid JSON that has files
      await handler('{"files":[{"name":"test","yml_content":"test"}]}');

      // Should filter out undefined when updating database
      expect(updateMessageFields).toHaveBeenCalledWith(
        'msg-xyz',
        expect.objectContaining({
          reasoning: expect.arrayContaining([
            expect.objectContaining({
              file_ids: expect.any(Array),
            }),
          ]),
        })
      );
    });
  });
});
