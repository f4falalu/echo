import { updateMessageFields } from '@buster/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCreateMetricsTool } from './create-metrics-tool';
import type { CreateMetricsInput } from './create-metrics-tool';

// Mock the database module
vi.mock('@buster/database', () => ({
  updateMessageFields: vi.fn(),
  db: {},
  metricFiles: {},
  assetPermissions: {},
}));

// Mock other dependencies
vi.mock('../../../utils/data-source-manager', () => ({
  getWorkflowDataSourceManager: vi.fn().mockResolvedValue({
    getDataSource: vi.fn().mockResolvedValue({
      executeQuery: vi.fn().mockResolvedValue({
        success: true,
        results: [{ count: 1 }],
        metadata: { rowCount: 1, totalRowCount: 1, executionTime: 100 },
      }),
    }),
  }),
}));

vi.mock('../version-history-helpers', () => ({
  validateMetricYml: vi.fn().mockReturnValue({
    name: 'Test Metric',
    type: 'metric',
    sql: 'SELECT 1',
    selectedChartType: 'bar',
    data: { xAxis: 'x', yAxis: ['y'] },
  }),
  createInitialMetricVersionHistory: vi.fn().mockReturnValue({
    versionNumber: 1,
    yml: {},
    createdAt: new Date(),
  }),
}));

vi.mock('../bar-line-axis-validator', () => ({
  validateAndAdjustBarLineAxes: vi.fn().mockReturnValue({
    isValid: true,
    shouldSwapAxes: false,
  }),
}));

vi.mock('../time-frame-helper', () => ({
  ensureTimeFrameQuoted: vi.fn((yml) => yml),
}));

vi.mock('../file-tracking-helper', () => ({
  trackFileAssociations: vi.fn(),
}));

vi.mock('../../../utils/sql-permissions', () => ({
  validateSqlPermissions: vi.fn().mockReturnValue({ hasAccess: true }),
  createPermissionErrorMessage: vi.fn(),
}));

describe('create-metrics streaming integration test', () => {
  const mockContext = {
    userId: 'user-123',
    chatId: 'chat-456',
    dataSourceId: 'ds-789',
    dataSourceSyntax: 'postgresql',
    organizationId: 'org-abc',
    messageId: 'msg-xyz',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('complete streaming flow', () => {
    it('should handle the complete streaming lifecycle', async () => {
      const tool = createCreateMetricsTool(mockContext);

      const input: CreateMetricsInput = {
        files: [
          {
            name: 'Revenue Metric',
            yml_content: `
name: Revenue Metric
type: metric
sql: SELECT date, revenue FROM sales
selectedChartType: bar
data:
  xAxis: date
  yAxis: [revenue]
            `.trim(),
          },
        ],
      };

      // Test that the tool was created with proper structure
      expect(tool).toHaveProperty('inputSchema');
      expect(tool).toHaveProperty('outputSchema');
      expect(tool).toHaveProperty('execute');
      expect(tool).toHaveProperty('onInputStart');
      expect(tool).toHaveProperty('onInputDelta');
      expect(tool).toHaveProperty('onInputAvailable');

      // Simulate the streaming lifecycle
      const startPromise = tool.onInputStart?.(input, { toolCallId: 'call-123' });
      const deltaPromises: Promise<void>[] = [];
      const finishPromise = tool.onInputAvailable?.(input, { toolCallId: 'call-123' });

      // Simulate streaming deltas
      const jsonString = JSON.stringify(input);
      const chunks = [jsonString.slice(0, 20), jsonString.slice(20, 50), jsonString.slice(50)];

      for (const chunk of chunks) {
        const deltaPromise = tool.onInputDelta?.(chunk, { toolCallId: 'call-123' });
        if (deltaPromise) deltaPromises.push(deltaPromise);
      }

      // Wait for all streaming handlers
      await Promise.all([startPromise, ...deltaPromises, finishPromise]);

      // Verify database was updated during streaming
      expect(updateMessageFields).toHaveBeenCalled();

      // Check that reasoning entries were created
      const calls = vi.mocked(updateMessageFields).mock.calls;
      const reasoningCalls = calls.filter(
        ([_messageId, fields]) => fields.reasoning && fields.reasoning.length > 0
      );
      expect(reasoningCalls.length).toBeGreaterThan(0);

      // Verify the reasoning entry structure
      const lastReasoningCall = reasoningCalls[reasoningCalls.length - 1];
      const reasoningEntry = lastReasoningCall[1].reasoning[0];
      expect(reasoningEntry).toMatchObject({
        type: 'files',
        status: 'loading',
        title: expect.any(String),
        file_ids: expect.any(Array),
        files: expect.any(Object),
      });
    });

    it('should handle streaming with partial JSON', async () => {
      const tool = createCreateMetricsTool(mockContext);

      // Start with empty state
      await tool.onInputStart?.({ files: [] }, { toolCallId: 'call-123' });

      // Stream partial JSON that builds up a file
      const partialChunks = [
        '{"files":[',
        '{"name":"Metric 1",',
        '"yml_content":"name: Metric 1\\ntype: metric',
        '\\nsql: SELECT 1\\nselectedChartType: bar',
        '\\ndata:\\n  xAxis: x\\n  yAxis: [y]"',
        '}]}',
      ];

      for (const chunk of partialChunks) {
        await tool.onInputDelta?.(chunk, { toolCallId: 'call-123' });
      }

      // Finish streaming
      const fullInput: CreateMetricsInput = {
        files: [
          {
            name: 'Metric 1',
            yml_content:
              'name: Metric 1\ntype: metric\nsql: SELECT 1\nselectedChartType: bar\ndata:\n  xAxis: x\n  yAxis: [y]',
          },
        ],
      };
      await tool.onInputAvailable?.(fullInput, { toolCallId: 'call-123' });

      // Verify progressive updates
      const calls = vi.mocked(updateMessageFields).mock.calls;
      expect(calls.length).toBeGreaterThan(1);
    });

    it('should handle multiple files streaming', async () => {
      const tool = createCreateMetricsTool(mockContext);

      const input: CreateMetricsInput = {
        files: [
          {
            name: 'Metric 1',
            yml_content: 'name: Metric 1\ntype: metric\nsql: SELECT 1',
          },
          {
            name: 'Metric 2',
            yml_content: 'name: Metric 2\ntype: metric\nsql: SELECT 2',
          },
        ],
      };

      // Start streaming
      await tool.onInputStart?.(input, { toolCallId: 'call-123' });

      // Stream complete object as delta
      await tool.onInputDelta?.(input, { toolCallId: 'call-123' });

      // Finish streaming
      await tool.onInputAvailable?.(input, { toolCallId: 'call-123' });

      // Verify files were tracked
      const calls = vi.mocked(updateMessageFields).mock.calls;
      const lastCall = calls[calls.length - 1];
      const reasoningEntry = lastCall[1].reasoning[0];

      expect(reasoningEntry.file_ids).toHaveLength(2);
      expect(Object.keys(reasoningEntry.files)).toHaveLength(2);
    });

    it('should handle streaming without messageId', async () => {
      const contextWithoutMessageId = {
        ...mockContext,
        messageId: undefined,
      };

      const tool = createCreateMetricsTool(contextWithoutMessageId);

      const input: CreateMetricsInput = {
        files: [
          {
            name: 'Test Metric',
            yml_content: 'name: Test\ntype: metric\nsql: SELECT 1',
          },
        ],
      };

      // Run through streaming lifecycle
      await tool.onInputStart?.(input, { toolCallId: 'call-123' });
      await tool.onInputDelta?.(JSON.stringify(input), { toolCallId: 'call-123' });
      await tool.onInputAvailable?.(input, { toolCallId: 'call-123' });

      // Should not update database
      expect(updateMessageFields).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully during streaming', async () => {
      vi.mocked(updateMessageFields).mockRejectedValue(new Error('Database error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const tool = createCreateMetricsTool(mockContext);

      const input: CreateMetricsInput = {
        files: [
          {
            name: 'Test Metric',
            yml_content: 'name: Test\ntype: metric\nsql: SELECT 1',
          },
        ],
      };

      // Run through streaming lifecycle
      await tool.onInputStart?.(input, { toolCallId: 'call-123' });
      await tool.onInputDelta?.(JSON.stringify(input), { toolCallId: 'call-123' });
      await tool.onInputAvailable?.(input, { toolCallId: 'call-123' });

      // Should log errors but not throw
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should progressively build file content during streaming', async () => {
      const tool = createCreateMetricsTool(mockContext);

      await tool.onInputStart?.({ files: [] }, { toolCallId: 'call-123' });

      // First delta - just file name
      await tool.onInputDelta?.('{"files":[{"name":"Progressive Metric"}', {
        toolCallId: 'call-123',
      });

      // Check first update
      let calls = vi.mocked(updateMessageFields).mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(1);

      // Second delta - add yml_content
      await tool.onInputDelta?.(
        '{"files":[{"name":"Progressive Metric","yml_content":"name: Progressive\\ntype: metric"}',
        { toolCallId: 'call-123' }
      );

      // Check second update
      calls = vi.mocked(updateMessageFields).mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(2);

      // Final delta - complete content
      const fullInput: CreateMetricsInput = {
        files: [
          {
            name: 'Progressive Metric',
            yml_content: 'name: Progressive\ntype: metric\nsql: SELECT 1',
          },
        ],
      };
      await tool.onInputAvailable?.(fullInput, { toolCallId: 'call-123' });

      // Verify progressive updates
      calls = vi.mocked(updateMessageFields).mock.calls;
      const reasoningUpdates = calls.filter(([_, fields]) => fields.reasoning?.length > 0);
      expect(reasoningUpdates.length).toBeGreaterThan(0);
    });
  });
});
