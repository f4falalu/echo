import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCreateDashboardsDelta } from './create-dashboards-delta';
import type {
  CreateDashboardsContext,
  CreateDashboardsFile,
  CreateDashboardsState,
} from './create-dashboards-tool';

vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn(),
}));

vi.mock('../../../utils/streaming/optimistic-json-parser', () => ({
  OptimisticJsonParser: {
    parse: vi.fn(),
  },
  getOptimisticValue: vi.fn(),
}));

describe('createCreateDashboardsDelta', () => {
  let context: CreateDashboardsContext;
  let state: CreateDashboardsState;
  let updateMessageEntriesSpy: ReturnType<typeof vi.fn>;
  let OptimisticJsonParser: { parse: ReturnType<typeof vi.fn> };
  let getOptimisticValue: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const database = await import('@buster/database');
    updateMessageEntriesSpy = vi.mocked(database.updateMessageEntries);

    const streaming = await import('../../../utils/streaming/optimistic-json-parser');
    OptimisticJsonParser = streaming.OptimisticJsonParser as unknown as {
      parse: ReturnType<typeof vi.fn>;
    };
    getOptimisticValue = vi.mocked(streaming.getOptimisticValue);

    context = {
      userId: 'user-1',
      chatId: 'chat-1',
      dataSourceId: 'ds-1',
      dataSourceSyntax: 'postgresql',
      organizationId: 'org-1',
      messageId: 'msg-1',
    };

    state = {
      argsText: '',
      files: [],
      toolCallId: 'tool-123',
    };
  });

  describe('string delta handling', () => {
    it('should accumulate string deltas', async () => {
      vi.mocked(OptimisticJsonParser.parse).mockReturnValue({
        parsed: null,
        isComplete: false,
        extractedValues: new Map(),
      });

      const handler = createCreateDashboardsDelta(context, state);
      await handler({ inputTextDelta: '{"files":[', toolCallId: 'tool-123', messages: [] });

      expect(state.argsText).toBe('{"files":[');
      expect(OptimisticJsonParser.parse).toHaveBeenCalledWith('{"files":[');
    });

    it('should parse complete JSON and update files', async () => {
      vi.mocked(OptimisticJsonParser.parse).mockReturnValue({
        parsed: { files: [] },
        isComplete: true,
        extractedValues: new Map([['files', [{ name: 'Dashboard 1', yml_content: 'content1' }]]]),
      });

      getOptimisticValue.mockImplementation((map, key, defaultValue) => {
        if (key === 'files') return [{ name: 'Dashboard 1', yml_content: 'content1' }];
        if (key === 'name') return 'Dashboard 1';
        if (key === 'yml_content') return 'content1';
        return defaultValue;
      });

      const handler = createCreateDashboardsDelta(context, state);
      await handler({
        inputTextDelta: '{"files":[{"name":"Dashboard 1","yml_content":"content1"}]}',
        toolCallId: 'tool-123',
        messages: [],
      });

      const filesAfterComplete = state.files ?? [];
      expect(filesAfterComplete).toHaveLength(1);
      expect(filesAfterComplete[0]).toEqual({
        name: 'Dashboard 1',
        yml_content: 'content1',
        status: 'processing',
      });
    });

    it('should handle partial JSON with optimistic parsing', async () => {
      vi.mocked(OptimisticJsonParser.parse).mockReturnValue({
        parsed: { files: [{}] },
        isComplete: false,
        extractedValues: new Map([['files', [{ name: 'Partial' }]]]),
      });

      getOptimisticValue.mockImplementation((map, key, defaultValue) => {
        if (key === 'files') return [{ name: 'Partial' }];
        if (key === 'name') return 'Partial';
        if (key === 'yml_content') return '';
        return defaultValue;
      });

      const handler = createCreateDashboardsDelta(context, state);
      await handler({
        inputTextDelta: '{"files":[{"name":"Partial"',
        toolCallId: 'tool-123',
        messages: [],
      });

      // Should not add file without yml_content
      expect(state.files ?? []).toHaveLength(0);
    });
  });

  describe('object delta handling', () => {
    it('should handle object deltas with files', async () => {
      const handler = createCreateDashboardsDelta(context, state);
      await handler({
        inputTextDelta:
          '{"files":[{"name":"Dashboard 1","yml_content":"content1"},{"name":"Dashboard 2","yml_content":"content2"}]}',
        toolCallId: 'tool-123',
        messages: [],
      });

      const filesTwo = state.files ?? [];
      expect(filesTwo).toHaveLength(2);
      expect(filesTwo[0]).toEqual({
        name: 'Dashboard 1',
        yml_content: 'content1',
        status: 'processing',
      });
      expect(filesTwo[1]).toEqual({
        name: 'Dashboard 2',
        yml_content: 'content2',
        status: 'processing',
      });
    });

    it('should handle empty object delta', async () => {
      const handler = createCreateDashboardsDelta(context, state);
      await handler({ inputTextDelta: '{}', toolCallId: 'tool-123', messages: [] });

      expect(state.files ?? []).toHaveLength(0);
    });
  });

  describe('database updates', () => {
    it('should update database when messageId and reasoningEntryId exist', async () => {
      const handler = createCreateDashboardsDelta(context, state);
      await handler({
        inputTextDelta: '{"files":[{"name":"Dashboard 1","yml_content":"content1"}]}',
      });

      expect(updateMessageEntriesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: 'msg-1',
          mode: 'update',
          responseEntry: expect.objectContaining({
            type: 'files',
            title: 'Building new dashboards...',
            status: 'loading',
          }),
        })
      );
    });

    it('should not update database when messageId is missing', async () => {
      const contextWithoutMessageId = { ...context, messageId: undefined };
      const stateWithoutMessageId = { ...state, messageId: undefined };

      const handler = createCreateDashboardsDelta(contextWithoutMessageId, stateWithoutMessageId);
      await handler({
        inputTextDelta: '{"files":[{"name":"Dashboard 1","yml_content":"content1"}]}',
      });

      expect(updateMessageEntriesSpy).not.toHaveBeenCalled();
    });

    it('should not update database when reasoningEntryId is missing', async () => {
      const stateWithoutToolCallId = { ...state, toolCallId: undefined };

      const handler = createCreateDashboardsDelta(context, stateWithoutToolCallId);
      await handler({
        inputTextDelta: '{"files":[{"name":"Dashboard 1","yml_content":"content1"}]}',
      });

      expect(updateMessageEntriesSpy).not.toHaveBeenCalled();
    });

    it('should handle database update errors gracefully', async () => {
      updateMessageEntriesSpy.mockRejectedValue(new Error('Database error'));

      const handler = createCreateDashboardsDelta(context, state);

      // Should not throw
      await expect(
        handler({ inputTextDelta: '{"files":[{"name":"Dashboard 1","yml_content":"content1"}]}' })
      ).resolves.not.toThrow();

      // State should still be updated
      expect(state.files).toHaveLength(1);
    });

    it('should filter out undefined entries before updating database', async () => {
      state.files = [
        { name: 'Dashboard 1', yml_content: 'content1' },
        undefined as unknown as CreateDashboardsState['files'][number],
        { name: 'Dashboard 2', yml_content: 'content2' },
      ];

      const handler = createCreateDashboardsDelta(context, state);
      await handler({ inputTextDelta: '' });

      // updateMessageReasoning should be called with filtered files
      expect(updateMessageEntriesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: 'msg-1',
          responseEntry: expect.objectContaining({ file_ids: expect.any(Array) }),
        })
      );
    });
  });

  describe('complex streaming scenarios', () => {
    it('should handle multiple string deltas building up JSON', async () => {
      const handler = createCreateDashboardsDelta(context, state);

      // First delta
      OptimisticJsonParser.parse.mockReturnValue({
        parsed: null,
        isComplete: false,
        extractedValues: new Map(),
      });
      await handler({ inputTextDelta: '{"files":[' });
      expect(state.argsText).toBe('{"files":[');

      // Second delta
      OptimisticJsonParser.parse.mockReturnValue({
        parsed: { files: [{}] },
        isComplete: false,
        extractedValues: new Map([['files', [{ name: 'Dashboard 1' }]]]),
      });
      getOptimisticValue.mockImplementation((map, key, defaultValue) => {
        if (key === 'files') return [{ name: 'Dashboard 1' }];
        if (key === 'name') return 'Dashboard 1';
        return defaultValue;
      });
      await handler({ inputTextDelta: '{"name":"Dashboard 1",' });
      expect(state.argsText).toBe('{"files":[{"name":"Dashboard 1",');

      // Final delta
      OptimisticJsonParser.parse.mockReturnValue({
        parsed: { files: [{ name: 'Dashboard 1', yml_content: 'content1' }] },
        isComplete: true,
        extractedValues: new Map([['files', [{ name: 'Dashboard 1', yml_content: 'content1' }]]]),
      });
      getOptimisticValue.mockImplementation((map, key, defaultValue) => {
        if (key === 'files') return [{ name: 'Dashboard 1', yml_content: 'content1' }];
        if (key === 'name') return 'Dashboard 1';
        if (key === 'yml_content') return 'content1';
        return defaultValue;
      });
      await handler({ inputTextDelta: '"yml_content":"content1"}]}' });

      expect(state.files).toHaveLength(1);
      expect(state.files[0]).toEqual({
        name: 'Dashboard 1',
        yml_content: 'content1',
        status: 'processing',
      });
    });
  });
});
