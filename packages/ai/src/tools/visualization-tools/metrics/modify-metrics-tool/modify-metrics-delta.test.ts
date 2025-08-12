import { updateMessageEntries } from '@buster/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createModifyMetricsDelta } from './modify-metrics-delta';
import type { ModifyMetricsInput, ModifyMetricsState } from './modify-metrics-tool';

vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn(),
}));

// Mock the optimistic JSON parser
const mockParse = vi.fn();
const mockGetOptimisticValue = vi.fn();

vi.mock('../../../../utils/streaming/optimistic-json-parser', () => ({
  OptimisticJsonParser: {
    parse: mockParse,
  },
  getOptimisticValue: mockGetOptimisticValue,
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
      mockParse.mockReturnValue({
        parsed: null,
        isComplete: false,
        extractedValues: new Map(),
      });
      mockGetOptimisticValue.mockReturnValue([]);

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler({ inputTextDelta: '{"files":[', toolCallId: 'tool-123', messages: [] });

      expect(state.argsText).toBe('{"files":[');
      expect(mockParse).toHaveBeenCalledWith('{"files":[');
    });

    it('should update parsedArgs when JSON is parsed', async () => {
      const parsedData = { files: [{ id: 'metric-1', yml_content: 'content' }] };
      mockParse.mockReturnValue({
        parsed: parsedData,
        isComplete: true,
        extractedValues: new Map(),
      });
      mockGetOptimisticValue.mockReturnValue([]);

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler({ inputTextDelta: 'complete json', toolCallId: 'tool-123', messages: [] });

      // State should have accumulated the parsed data in argsText
      expect(state.argsText).toBe('complete json');
    });

    it('should update state files from parsed array', async () => {
      mockParse.mockReturnValue({
        parsed: {},
        isComplete: false,
        extractedValues: new Map(),
      });
      mockGetOptimisticValue.mockReturnValue([
        { id: 'metric-1', yml_content: 'content1', name: 'Metric 1' },
        { id: 'metric-2', yml_content: 'content2' },
      ]);

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler({ inputTextDelta: 'delta', toolCallId: 'tool-123', messages: [] });

      expect(state.files).toHaveLength(2);
      expect(state.files![0]).toEqual({
        id: 'metric-1',
        yml_content: 'content1',
        name: 'Metric 1',
        status: 'loading',
      });
      expect(state.files![1]).toEqual({
        id: 'metric-2',
        yml_content: 'content2',
        name: undefined,
        status: 'loading',
      });
    });

    it('should update existing files in state', async () => {
      const { OptimisticJsonParser, getOptimisticValue } = await import(
        '../../../../utils/streaming/optimistic-json-parser'
      );

      // Pre-populate state with a file
      state.files = [
        {
          id: 'metric-1',
          yml_content: '',
          status: 'loading',
          file_type: 'metric',
          version_number: 1,
        },
      ];

      mockParse.mockReturnValue({
        parsed: {},
        isComplete: false,
        extractedValues: new Map(),
      });
      mockGetOptimisticValue.mockReturnValue([
        { id: 'metric-1', yml_content: 'updated content', name: 'Updated Name' },
      ]);

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler({ inputTextDelta: 'delta', toolCallId: 'tool-123', messages: [] });

      expect(state.files![0]).toEqual({
        id: 'metric-1',
        yml_content: 'updated content',
        name: 'Updated Name',
        status: 'loading',
      });
    });

    it('should handle partial file data', async () => {
      mockParse.mockReturnValue({
        parsed: {},
        isComplete: false,
        extractedValues: new Map(),
      });

      // First delta with just ID
      mockGetOptimisticValue.mockReturnValue([{ id: 'metric-1' }]);

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler({ inputTextDelta: 'delta1', toolCallId: 'tool-123', messages: [] });

      expect(state.files![0]).toEqual({
        id: 'metric-1',
        yml_content: '',
        name: undefined,
        status: 'loading',
      });
    });

    it('should update database when messageId and toolCallId exist', async () => {
      mockParse.mockReturnValue({
        parsed: {},
        isComplete: false,
        extractedValues: new Map(),
      });
      mockGetOptimisticValue.mockReturnValue([{ id: 'metric-1', yml_content: 'content' }]);

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler({ inputTextDelta: 'delta', toolCallId: 'tool-123', messages: [] });

      expect(updateMessageEntries).toHaveBeenCalledWith({
        messageId: 'msg-123',
        mode: 'update',
        responseEntry: expect.any(Object),
        rawLlmMessage: expect.any(Object),
      });
    });

    it('should not update database when messageId is missing', async () => {
      const contextWithoutMessageId = { ...context };
      delete contextWithoutMessageId.messageId;

      mockParse.mockReturnValue({
        parsed: {},
        isComplete: false,
        extractedValues: new Map(),
      });
      mockGetOptimisticValue.mockReturnValue([{ id: 'metric-1', yml_content: 'content' }]);

      const deltaHandler = createModifyMetricsDelta(contextWithoutMessageId, state);
      await deltaHandler({ inputTextDelta: 'delta', toolCallId: 'tool-123', messages: [] });

      expect(updateMessageEntries).not.toHaveBeenCalled();
    });

    it('should filter undefined entries before creating reasoning message', async () => {
      // State with undefined entries
      state.files = [
        undefined as any,
        { id: 'metric-1', yml_content: 'content', status: 'loading' },
        undefined as any,
        { id: 'metric-2', yml_content: 'content2', status: 'loading' },
      ];

      mockParse.mockReturnValue({
        parsed: {},
        isComplete: false,
        extractedValues: new Map(),
      });
      mockGetOptimisticValue.mockReturnValue([]);

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler({ inputTextDelta: 'delta', toolCallId: 'tool-123', messages: [] });

      // The database update should be called with valid files
      expect(updateMessageEntries).toHaveBeenCalledWith({
        messageId: 'msg-123',
        mode: 'update',
        responseEntry: expect.any(Object),
        rawLlmMessage: expect.any(Object),
      });
    });

    it('should handle database update errors gracefully', async () => {
      (updateMessageEntries as any).mockRejectedValue(new Error('Database error'));

      mockParse.mockReturnValue({
        parsed: {},
        isComplete: false,
        extractedValues: new Map(),
      });
      mockGetOptimisticValue.mockReturnValue([{ id: 'metric-1', yml_content: 'content' }]);

      const deltaHandler = createModifyMetricsDelta(context, state);

      // Should not throw
      await expect(
        deltaHandler({ inputTextDelta: 'delta', toolCallId: 'tool-123', messages: [] })
      ).resolves.not.toThrow();

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
      await deltaHandler({
        inputTextDelta: JSON.stringify(delta),
        toolCallId: 'tool-123',
        messages: [],
      });

      // State should have accumulated the JSON string
      expect(state.argsText).toBe(JSON.stringify(delta));
      expect(state.files).toHaveLength(2);
      expect(state.files![0]).toEqual({
        id: 'metric-1',
        yml_content: 'content1',
        status: 'loading',
      });
    });

    it('should handle empty object delta', async () => {
      const delta: Partial<ModifyMetricsInput> = {};

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler({
        inputTextDelta: JSON.stringify(delta),
        toolCallId: 'tool-123',
        messages: [],
      });

      // State should have accumulated the empty JSON
      expect(state.argsText).toBe('{}');
      expect(state.files).toHaveLength(0);
    });
  });

  describe('logging', () => {
    it('should log correct information', async () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      mockParse.mockReturnValue({
        parsed: {},
        isComplete: false,
        extractedValues: new Map(),
      });
      (getOptimisticValue as any).mockReturnValue([{ id: 'metric-1', yml_content: 'content' }]);

      const deltaHandler = createModifyMetricsDelta(context, state);
      await deltaHandler({ inputTextDelta: 'delta', toolCallId: 'tool-123', messages: [] });

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
