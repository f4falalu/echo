import { updateMessageFields } from '@buster/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createModifyMetricsDelta } from './modify-metrics-delta';
import type { ModifyMetricsInput, ModifyMetricsState } from './modify-metrics-tool';

vi.mock('@buster/database', () => ({
  updateMessageFields: vi.fn(),
}));

vi.mock('../../../utils/streaming/optimistic-json-parser', () => ({
  OptimisticJsonParser: {
    parse: vi.fn(),
  },
  getOptimisticValue: vi.fn(),
}));

describe('createModifyMetricsDelta', () => {
  let state: ModifyMetricsState;
  let context: {
    messageId?: string;
    userId: string;
    chatId: string;
    dataSourceId: string;
    dataSourceSyntax: string;
    organizationId: string;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    state = {
      argsText: '',
      files: [],
      toolCallId: 'tool-123',
      reasoningEntryId: 'reasoning-123',
    };
    context = {
      userId: 'user-123',
      chatId: 'chat-123',
      dataSourceId: 'ds-123',
      dataSourceSyntax: 'postgres',
      organizationId: 'org-123',
      messageId: 'msg-123',
    };
  });

  describe('string delta handling', () => {
    it('should accumulate string deltas in argsText', async () => {
      const { OptimisticJsonParser, getOptimisticValue } = await import(
        '../../../utils/streaming/optimistic-json-parser'
      );
      (OptimisticJsonParser.parse as any).mockReturnValue({
        parsed: null,
        isComplete: false,
        extractedValues: new Map(),
      });
      (getOptimisticValue as any).mockReturnValue([]);

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler('{"files":[');

      expect(state.argsText).toBe('{"files":[');
      expect(OptimisticJsonParser.parse).toHaveBeenCalledWith('{"files":[');
    });

    it('should update parsedArgs when JSON is parsed', async () => {
      const { OptimisticJsonParser, getOptimisticValue } = await import(
        '../../../utils/streaming/optimistic-json-parser'
      );
      const parsedData = { files: [{ id: 'metric-1', yml_content: 'content' }] };
      (OptimisticJsonParser.parse as any).mockReturnValue({
        parsed: parsedData,
        isComplete: true,
        extractedValues: new Map(),
      });
      (getOptimisticValue as any).mockReturnValue([]);

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler('complete json');

      expect(state.parsedArgs).toEqual(parsedData);
    });

    it('should update state files from parsed array', async () => {
      const { OptimisticJsonParser, getOptimisticValue } = await import(
        '../../../utils/streaming/optimistic-json-parser'
      );
      (OptimisticJsonParser.parse as any).mockReturnValue({
        parsed: {},
        isComplete: false,
        extractedValues: new Map(),
      });
      (getOptimisticValue as any).mockReturnValue([
        { id: 'metric-1', yml_content: 'content1', name: 'Metric 1' },
        { id: 'metric-2', yml_content: 'content2' },
      ]);

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler('delta');

      expect(state.files).toHaveLength(2);
      expect(state.files[0]).toEqual({
        id: 'metric-1',
        yml_content: 'content1',
        name: 'Metric 1',
        status: 'processing',
      });
      expect(state.files[1]).toEqual({
        id: 'metric-2',
        yml_content: 'content2',
        name: undefined,
        status: 'processing',
      });
    });

    it('should update existing files in state', async () => {
      const { OptimisticJsonParser, getOptimisticValue } = await import(
        '../../../utils/streaming/optimistic-json-parser'
      );

      // Pre-populate state with a file
      state.files = [{ id: 'metric-1', yml_content: '', status: 'processing' }];

      (OptimisticJsonParser.parse as any).mockReturnValue({
        parsed: {},
        isComplete: false,
        extractedValues: new Map(),
      });
      (getOptimisticValue as any).mockReturnValue([
        { id: 'metric-1', yml_content: 'updated content', name: 'Updated Name' },
      ]);

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler('delta');

      expect(state.files[0]).toEqual({
        id: 'metric-1',
        yml_content: 'updated content',
        name: 'Updated Name',
        status: 'processing',
      });
    });

    it('should handle partial file data', async () => {
      const { OptimisticJsonParser, getOptimisticValue } = await import(
        '../../../utils/streaming/optimistic-json-parser'
      );
      (OptimisticJsonParser.parse as any).mockReturnValue({
        parsed: {},
        isComplete: false,
        extractedValues: new Map(),
      });

      // First delta with just ID
      (getOptimisticValue as any).mockReturnValue([{ id: 'metric-1' }]);

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler('delta1');

      expect(state.files[0]).toEqual({
        id: 'metric-1',
        yml_content: '',
        name: undefined,
        status: 'processing',
      });
    });

    it('should update database when messageId and reasoningEntryId exist', async () => {
      const { OptimisticJsonParser, getOptimisticValue } = await import(
        '../../../utils/streaming/optimistic-json-parser'
      );
      (OptimisticJsonParser.parse as any).mockReturnValue({
        parsed: {},
        isComplete: false,
        extractedValues: new Map(),
      });
      (getOptimisticValue as any).mockReturnValue([{ id: 'metric-1', yml_content: 'content' }]);

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler('delta');

      expect(updateMessageFields).toHaveBeenCalledWith('msg-123', {
        reasoning: expect.arrayContaining([
          expect.objectContaining({
            id: 'tool-123',
            type: 'files',
            status: 'loading',
          }),
        ]),
      });
    });

    it('should not update database when messageId is missing', async () => {
      const { OptimisticJsonParser, getOptimisticValue } = await import(
        '../../../utils/streaming/optimistic-json-parser'
      );
      context.messageId = undefined;

      (OptimisticJsonParser.parse as any).mockReturnValue({
        parsed: {},
        isComplete: false,
        extractedValues: new Map(),
      });
      (getOptimisticValue as any).mockReturnValue([{ id: 'metric-1', yml_content: 'content' }]);

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler('delta');

      expect(updateMessageFields).not.toHaveBeenCalled();
    });

    it('should not update database when reasoningEntryId is missing', async () => {
      const { OptimisticJsonParser, getOptimisticValue } = await import(
        '../../../utils/streaming/optimistic-json-parser'
      );
      state.reasoningEntryId = undefined;

      (OptimisticJsonParser.parse as any).mockReturnValue({
        parsed: {},
        isComplete: false,
        extractedValues: new Map(),
      });
      (getOptimisticValue as any).mockReturnValue([{ id: 'metric-1', yml_content: 'content' }]);

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler('delta');

      expect(updateMessageFields).not.toHaveBeenCalled();
    });

    it('should filter undefined entries before creating reasoning message', async () => {
      const { OptimisticJsonParser, getOptimisticValue } = await import(
        '../../../utils/streaming/optimistic-json-parser'
      );

      // State with undefined entries
      state.files = [
        undefined as any,
        { id: 'metric-1', yml_content: 'content', status: 'processing' },
        undefined as any,
        { id: 'metric-2', yml_content: 'content2', status: 'processing' },
      ];

      (OptimisticJsonParser.parse as any).mockReturnValue({
        parsed: {},
        isComplete: false,
        extractedValues: new Map(),
      });
      (getOptimisticValue as any).mockReturnValue([]);

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler('delta');

      // The reasoning message should only include valid files
      expect(updateMessageFields).toHaveBeenCalledWith('msg-123', {
        reasoning: expect.arrayContaining([
          expect.objectContaining({
            file_ids: ['metric-1', 'metric-2'],
          }),
        ]),
      });
    });

    it('should handle database update errors gracefully', async () => {
      const { OptimisticJsonParser, getOptimisticValue } = await import(
        '../../../utils/streaming/optimistic-json-parser'
      );
      (updateMessageFields as any).mockRejectedValue(new Error('Database error'));

      (OptimisticJsonParser.parse as any).mockReturnValue({
        parsed: {},
        isComplete: false,
        extractedValues: new Map(),
      });
      (getOptimisticValue as any).mockReturnValue([{ id: 'metric-1', yml_content: 'content' }]);

      const deltaHandler = createModifyMetricsDelta(context, state);

      // Should not throw
      await expect(deltaHandler('delta')).resolves.not.toThrow();

      // State should still be updated
      expect(state.files).toHaveLength(1);
    });
  });

  describe('object delta handling', () => {
    it('should handle complete object delta', async () => {
      const delta: Partial<ModifyMetricsInput> = {
        files: [
          { id: 'metric-1', yml_content: 'content1' },
          { id: 'metric-2', yml_content: 'content2' },
        ],
      };

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler(delta);

      expect(state.parsedArgs).toEqual(delta);
      expect(state.files).toHaveLength(2);
      expect(state.files[0]).toEqual({
        id: 'metric-1',
        yml_content: 'content1',
        status: 'processing',
      });
    });

    it('should handle empty object delta', async () => {
      const delta: Partial<ModifyMetricsInput> = {};

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler(delta);

      expect(state.parsedArgs).toBeUndefined();
      expect(state.files).toHaveLength(0);
    });
  });

  describe('logging', () => {
    it('should log correct information', async () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const { OptimisticJsonParser, getOptimisticValue } = await import(
        '../../../utils/streaming/optimistic-json-parser'
      );

      (OptimisticJsonParser.parse as any).mockReturnValue({
        parsed: {},
        isComplete: false,
        extractedValues: new Map(),
      });
      (getOptimisticValue as any).mockReturnValue([{ id: 'metric-1', yml_content: 'content' }]);

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler('delta');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[modify-metrics] Input delta processed',
        expect.objectContaining({
          hasFiles: true,
          fileCount: 1,
          processedCount: 1,
          messageId: 'msg-123',
          timestamp: expect.any(String),
        })
      );

      consoleSpy.mockRestore();
    });
  });
});
