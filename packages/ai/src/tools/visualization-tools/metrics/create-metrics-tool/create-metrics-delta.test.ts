import { updateMessageEntries } from '@buster/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCreateMetricsDelta } from './create-metrics-delta';
import type { CreateMetricsState } from './create-metrics-tool';

// Mock the database module
vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn(),
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
      argsText: undefined,
      files: undefined,
      parsedArgs: undefined,
      toolCallId: 'tool-123',
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

      expect(state.files).toBeDefined();
      expect(state.files!).toHaveLength(1);
      expect(state.files![0]).toEqual({
        name: 'metric1',
        yml_content: 'content1',
        status: 'processing',
      });
    });

    it('should handle multiple files in streaming JSON', async () => {
      const handler = createCreateMetricsDelta(mockContext, state);

      // Stream in multiple files - first complete file
      await handler('{"files":[{"name":"metric1","yml_content":"content1"}');
      expect(state.files).toBeDefined();
      expect(state.files!).toHaveLength(1);

      // Stream in second file by accumulating more text
      state.argsText = '{"files":[{"name":"metric1","yml_content":"content1"},';
      await handler('{"name":"metric2","yml_content":"content2"}');

      // Now both files should be present
      expect(state.files!).toHaveLength(2);
      expect(state.files![1]).toEqual({
        name: 'metric2',
        yml_content: 'content2',
        status: 'processing',
      });
    });

    it('should update existing files when content changes', async () => {
      const handler = createCreateMetricsDelta(mockContext, state);

      // Add initial file with just name
      await handler('{"files":[{"name":"metric1"}]}');
      expect(state.files).toBeDefined();
      expect(state.files![0]?.yml_content).toBe('');

      // Reset args text and update with content
      state.argsText = '';
      await handler('{"files":[{"name":"metric1","yml_content":"updated content"}]}');
      expect(state.files![0]?.yml_content).toBe('updated content');
    });

    it('should update database with progress when messageId exists', async () => {
      const handler = createCreateMetricsDelta(mockContext, state);

      await handler('{"files":[{"name":"metric1","yml_content":"content1"}]}');

      expect(updateMessageEntries).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: 'msg-xyz',
          reasoningEntry: expect.any(Object),
          mode: 'update',
        })
      );
    });

    it('should handle database update errors gracefully', async () => {
      vi.mocked(updateMessageEntries).mockRejectedValue(new Error('Database error'));
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

    it('should not update database when messageId is missing', async () => {
      const contextWithoutMessageId = { ...mockContext, messageId: undefined };
      const handler = createCreateMetricsDelta(contextWithoutMessageId, state);

      await handler('{"files":[{"name":"metric1","yml_content":"content1"}]}');

      expect(updateMessageEntries).not.toHaveBeenCalled();
    });
  });

  describe('object delta handling', () => {
    it('should handle complete object deltas', async () => {
      const handler = createCreateMetricsDelta(mockContext, state);

      const input = {
        files: [
          { name: 'metric1', yml_content: 'content1' },
          { name: 'metric2', yml_content: 'content2' },
        ],
      };

      await handler(input);

      expect(state.parsedArgs).toEqual(input);
      expect(state.files).toBeDefined();
      expect(state.files!).toHaveLength(2);
      expect(state.files![0]).toEqual({
        name: 'metric1',
        yml_content: 'content1',
        status: 'processing',
      });
    });

    it('should handle empty files array', async () => {
      const handler = createCreateMetricsDelta(mockContext, state);

      await handler({ files: [] });

      expect(state.files).toBeDefined();
      expect(state.files!).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle malformed JSON gracefully', async () => {
      const handler = createCreateMetricsDelta(mockContext, state);

      // This should not throw
      await handler('{"files":[{"broken');

      // State should be partially updated
      expect(state.argsText).toBe('{"files":[{"broken');
    });

    it('should initialize files array if undefined', async () => {
      const handler = createCreateMetricsDelta(mockContext, state);

      // Ensure files is undefined initially
      expect(state.files).toBeUndefined();

      await handler('{"files":[]}');

      // Files should now be initialized
      expect(state.files).toBeDefined();
      expect(state.files!).toHaveLength(0);
    });

    it('should handle rapid successive deltas', async () => {
      const handler = createCreateMetricsDelta(mockContext, state);

      // Simulate rapid streaming
      await handler('{"fil');
      await handler('es":[');
      await handler('{"name":');
      await handler('"metric1",');
      await handler('"yml_content":');
      await handler('"content1"}');
      await handler(']}');

      // Should accumulate properly
      expect(state.argsText).toBe('{"files":[{"name":"metric1","yml_content":"content1"}]}');
      expect(state.files).toBeDefined();
      expect(state.files!).toHaveLength(1);
    });
  });
});
