import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCreateDashboardsDelta } from './create-dashboards-delta';
import type { CreateDashboardsAgentContext, CreateDashboardsState } from './create-dashboards-tool';

vi.mock('@buster/database', () => ({
  updateMessageReasoning: vi.fn(),
}));

vi.mock('@buster/ai/utils/streaming', () => ({
  OptimisticJsonParser: {
    parse: vi.fn(),
  },
  getOptimisticValue: vi.fn(),
}));

describe('createCreateDashboardsDelta', () => {
  let context: CreateDashboardsAgentContext;
  let state: CreateDashboardsState;
  let updateMessageReasoning: ReturnType<typeof vi.fn>;
  let OptimisticJsonParser: { parse: ReturnType<typeof vi.fn> };
  let getOptimisticValue: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const database = await import('@buster/database');
    updateMessageReasoning = vi.mocked(database.updateMessageReasoning);

    const streaming = await import('@buster/ai/utils/streaming');
    OptimisticJsonParser = streaming.OptimisticJsonParser as any;
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
      messageId: 'msg-1',
      toolCallId: 'tool-123',
      reasoningEntryId: 'reasoning-1',
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
      await handler('{"files":[');

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
      await handler('{"files":[{"name":"Dashboard 1","yml_content":"content1"}]}');

      expect(state.files).toHaveLength(1);
      expect(state.files[0]).toEqual({
        name: 'Dashboard 1',
        yml_content: 'content1',
        status: 'processing',
      });
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
      await handler('{"files":[{"name":"Partial"');

      // Should not add file without yml_content
      expect(state.files).toHaveLength(0);
    });
  });

  describe('object delta handling', () => {
    it('should handle object deltas with files', async () => {
      const handler = createCreateDashboardsDelta(context, state);
      await handler({
        files: [
          { name: 'Dashboard 1', yml_content: 'content1' },
          { name: 'Dashboard 2', yml_content: 'content2' },
        ],
      });

      expect(state.files).toHaveLength(2);
      expect(state.files[0]).toEqual({
        name: 'Dashboard 1',
        yml_content: 'content1',
        status: 'processing',
      });
      expect(state.files[1]).toEqual({
        name: 'Dashboard 2',
        yml_content: 'content2',
        status: 'processing',
      });
    });

    it('should handle empty object delta', async () => {
      const handler = createCreateDashboardsDelta(context, state);
      await handler({});

      expect(state.files).toHaveLength(0);
    });
  });

  describe('database updates', () => {
    it('should update database when messageId and reasoningEntryId exist', async () => {
      const handler = createCreateDashboardsDelta(context, state);
      await handler({
        files: [{ name: 'Dashboard 1', yml_content: 'content1' }],
      });

      expect(updateMessageReasoning).toHaveBeenCalledWith(
        'msg-1',
        'reasoning-1',
        expect.objectContaining({
          type: 'files',
          title: 'Building new dashboards...',
          status: 'loading',
        })
      );
    });

    it('should not update database when messageId is missing', async () => {
      const contextWithoutMessageId = { ...context, messageId: undefined };
      const stateWithoutMessageId = { ...state, messageId: undefined };

      const handler = createCreateDashboardsDelta(contextWithoutMessageId, stateWithoutMessageId);
      await handler({
        files: [{ name: 'Dashboard 1', yml_content: 'content1' }],
      });

      expect(updateMessageReasoning).not.toHaveBeenCalled();
    });

    it('should not update database when reasoningEntryId is missing', async () => {
      const stateWithoutReasoningId = { ...state, reasoningEntryId: undefined };

      const handler = createCreateDashboardsDelta(context, stateWithoutReasoningId);
      await handler({
        files: [{ name: 'Dashboard 1', yml_content: 'content1' }],
      });

      expect(updateMessageReasoning).not.toHaveBeenCalled();
    });

    it('should handle database update errors gracefully', async () => {
      updateMessageReasoning.mockRejectedValue(new Error('Database error'));

      const handler = createCreateDashboardsDelta(context, state);

      // Should not throw
      await expect(
        handler({
          files: [{ name: 'Dashboard 1', yml_content: 'content1' }],
        })
      ).resolves.not.toThrow();

      // State should still be updated
      expect(state.files).toHaveLength(1);
    });

    it('should filter out undefined entries before updating database', async () => {
      state.files = [
        { name: 'Dashboard 1', yml_content: 'content1' },
        undefined as any,
        { name: 'Dashboard 2', yml_content: 'content2' },
      ];

      const handler = createCreateDashboardsDelta(context, state);
      await handler({});

      // updateMessageReasoning should be called with filtered files
      expect(updateMessageReasoning).toHaveBeenCalledWith(
        'msg-1',
        'reasoning-1',
        expect.objectContaining({
          file_ids: expect.any(Array),
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
      await handler('{"files":[');
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
      await handler('{"name":"Dashboard 1",');
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
      await handler('"yml_content":"content1"}]}');

      expect(state.files).toHaveLength(1);
      expect(state.files[0]).toEqual({
        name: 'Dashboard 1',
        yml_content: 'content1',
        status: 'processing',
      });
    });
  });
});
