import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCreateDashboardsDelta } from './create-dashboards-delta';
import type {
  CreateDashboardsContext,
  CreateDashboardStateFile,
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

    const streaming = await import('../../../../utils/streaming/optimistic-json-parser');
    OptimisticJsonParser = streaming.OptimisticJsonParser as unknown as {
      parse: ReturnType<typeof vi.fn>;
    };
    getOptimisticValue = streaming.getOptimisticValue as ReturnType<typeof vi.fn>;
    
    // Set OptimisticJsonParser.parse and getOptimisticValue as mock functions
    OptimisticJsonParser.parse = vi.fn();
    getOptimisticValue = vi.fn();

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
      OptimisticJsonParser.parse.mockReturnValue({
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
      OptimisticJsonParser.parse.mockReturnValue({
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
      expect(filesAfterComplete[0]).toMatchObject({
        file_name: 'Dashboard 1',
        file_type: 'dashboard',
        version_number: 1,
        file: {
          text: 'content1',
        },
        status: 'loading',
      });
      expect(filesAfterComplete[0].id).toBeDefined();
    });

    it('should handle partial JSON with optimistic parsing', async () => {
      OptimisticJsonParser.parse.mockReturnValue({
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

      // Should add file with name even without yml_content
      const files = state.files ?? [];
      expect(files).toHaveLength(1);
      expect(files[0]).toMatchObject({
        file_name: 'Partial',
        file_type: 'dashboard',
        version_number: 1,
        file: undefined,
        status: 'loading',
      });
    });
  });

  describe('object delta handling', () => {
    it('should handle object deltas with files', async () => {
      OptimisticJsonParser.parse.mockReturnValue({
        parsed: { files: [] },
        isComplete: true,
        extractedValues: new Map([['files', [
          { name: 'Dashboard 1', yml_content: 'content1' },
          { name: 'Dashboard 2', yml_content: 'content2' }
        ]]]),
      });

      getOptimisticValue.mockImplementation((map, key, defaultValue) => {
        if (key === 'files') return [
          { name: 'Dashboard 1', yml_content: 'content1' },
          { name: 'Dashboard 2', yml_content: 'content2' }
        ];
        if (map.get('name') === 'Dashboard 1') {
          if (key === 'name') return 'Dashboard 1';
          if (key === 'yml_content') return 'content1';
        }
        if (map.get('name') === 'Dashboard 2') {
          if (key === 'name') return 'Dashboard 2';
          if (key === 'yml_content') return 'content2';
        }
        return defaultValue;
      });

      const handler = createCreateDashboardsDelta(context, state);
      await handler({
        inputTextDelta:
          '{"files":[{"name":"Dashboard 1","yml_content":"content1"},{"name":"Dashboard 2","yml_content":"content2"}]}',
        toolCallId: 'tool-123',
        messages: [],
      });

      const filesTwo = state.files ?? [];
      expect(filesTwo).toHaveLength(2);
      expect(filesTwo[0]).toMatchObject({
        file_name: 'Dashboard 1',
        file_type: 'dashboard',
        version_number: 1,
        file: {
          text: 'content1',
        },
        status: 'loading',
      });
      expect(filesTwo[1]).toMatchObject({
        file_name: 'Dashboard 2',
        file_type: 'dashboard',
        version_number: 1,
        file: {
          text: 'content2',
        },
        status: 'loading',
      });
    });

    it('should handle empty object delta', async () => {
      OptimisticJsonParser.parse.mockReturnValue({
        parsed: {},
        isComplete: true,
        extractedValues: new Map(),
      });

      const handler = createCreateDashboardsDelta(context, state);
      await handler({ inputTextDelta: '{}', toolCallId: 'tool-123', messages: [] });

      expect(state.files ?? []).toHaveLength(0);
    });
  });

  describe('database updates', () => {
    it('should update database when messageId and reasoningEntryId exist', async () => {
      OptimisticJsonParser.parse.mockReturnValue({
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
      });

      expect(updateMessageEntriesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: 'msg-1',
          mode: 'update',
          responseEntry: expect.objectContaining({
            type: 'files',
            title: 'Creating dashboards...',
            status: 'loading',
          }),
        })
      );
    });

    it('should not update database when messageId is missing', async () => {
      OptimisticJsonParser.parse.mockReturnValue({
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

      const contextWithoutMessageId = { ...context, messageId: undefined };
      const stateWithoutMessageId = { ...state, messageId: undefined };

      const handler = createCreateDashboardsDelta(contextWithoutMessageId, stateWithoutMessageId);
      await handler({
        inputTextDelta: '{"files":[{"name":"Dashboard 1","yml_content":"content1"}]}',
      });

      expect(updateMessageEntriesSpy).not.toHaveBeenCalled();
    });

    it('should not update database when reasoningEntryId is missing', async () => {
      OptimisticJsonParser.parse.mockReturnValue({
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

      const stateWithoutToolCallId = { ...state, toolCallId: undefined };

      const handler = createCreateDashboardsDelta(context, stateWithoutToolCallId);
      await handler({
        inputTextDelta: '{"files":[{"name":"Dashboard 1","yml_content":"content1"}]}',
      });

      expect(updateMessageEntriesSpy).not.toHaveBeenCalled();
    });

    it('should handle database update errors gracefully', async () => {
      OptimisticJsonParser.parse.mockReturnValue({
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
      OptimisticJsonParser.parse.mockReturnValue({
        parsed: null,
        isComplete: false,
        extractedValues: new Map(),
      });

      state.files = [
        {
          id: 'id-1',
          file_name: 'Dashboard 1',
          file_type: 'dashboard',
          version_number: 1,
          file: { text: 'content1' },
          status: 'loading',
        },
        undefined as unknown as CreateDashboardsState['files'][number],
        {
          id: 'id-2',
          file_name: 'Dashboard 2',
          file_type: 'dashboard',
          version_number: 1,
          file: { text: 'content2' },
          status: 'loading',
        },
      ];

      const handler = createCreateDashboardsDelta(context, state);
      await handler({ inputTextDelta: '', toolCallId: 'tool-123' });

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
      expect(state.files[0]).toMatchObject({
        file_name: 'Dashboard 1',
        file_type: 'dashboard',
        version_number: 1,
        file: {
          text: 'content1',
        },
        status: 'loading',
      });
    });
  });
});
