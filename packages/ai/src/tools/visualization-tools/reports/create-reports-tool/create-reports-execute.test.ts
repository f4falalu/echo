import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCreateReportsExecute } from './create-reports-execute';
import type {
  CreateReportsContext,
  CreateReportsInput,
  CreateReportsState,
} from './create-reports-tool';

// Mock dependencies
vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('../helpers/report-metric-helper', () => ({
  reportContainsMetrics: vi.fn(),
}));

vi.mock('./helpers/create-reports-tool-transform-helper', () => ({
  createCreateReportsRawLlmMessageEntry: vi.fn().mockReturnValue({
    id: 'raw-llm-1',
    type: 'raw-llm',
    content: 'raw llm content',
  }),
  createCreateReportsReasoningEntry: vi.fn().mockReturnValue({
    id: 'reasoning-1',
    type: 'reasoning',
    content: 'reasoning content',
  }),
}));

vi.mock('../../../shared/create-raw-llm-tool-result-entry', () => ({
  createRawToolResultEntry: vi.fn().mockReturnValue({
    id: 'result-1',
    type: 'tool-result',
    content: 'result content',
  }),
}));

import { updateMessageEntries } from '@buster/database';
import { reportContainsMetrics } from '../helpers/report-metric-helper';

describe('create-reports-execute', () => {
  let context: CreateReportsContext;
  let state: CreateReportsState;
  let mockUpdateMessageEntries: ReturnType<typeof vi.fn>;
  let mockReportContainsMetrics: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUpdateMessageEntries = updateMessageEntries as ReturnType<typeof vi.fn>;
    mockReportContainsMetrics = reportContainsMetrics as ReturnType<typeof vi.fn>;

    context = {
      userId: 'user-123',
      chatId: 'chat-456',
      organizationId: 'org-789',
      messageId: 'msg-001',
    };

    state = {
      toolCallId: 'tool-call-123',
      files: [],
      startTime: Date.now(),
    };
  });

  describe('responseMessages conditional logic', () => {
    it('should add report to responseMessages when it contains metrics', async () => {
      // Setup state with a successful report
      state.files = [
        {
          id: 'report-1',
          file_name: 'Sales Report Q4',
          file_type: 'report',
          version_number: 1,
          status: 'completed',
        },
      ];

      const input: CreateReportsInput = {
        files: [
          {
            name: 'Sales Report Q4',
            content: `
              # Sales Report Q4
              <metric metricId="24db2cc8-79b0-488f-bd45-8b5412d1bf08" />
              Sales increased by 25%.
            `,
          },
        ],
      };

      // Mock that the report contains metrics
      mockReportContainsMetrics.mockReturnValue(true);

      const execute = createCreateReportsExecute(context, state);
      await execute(input);

      // Check that updateMessageEntries was called with responseMessages
      expect(mockUpdateMessageEntries).toHaveBeenCalled();
      // Get the last call (final entries) which should have responseMessages
      const lastCallIndex = mockUpdateMessageEntries.mock.calls.length - 1;
      const updateCall = mockUpdateMessageEntries.mock.calls[lastCallIndex]?.[0];

      expect(updateCall.responseMessages).toBeDefined();
      expect(updateCall.responseMessages?.length).toBe(1);
      expect(updateCall.responseMessages?.[0]).toMatchObject({
        id: 'report-1',
        type: 'file',
        file_type: 'report',
        file_name: 'Sales Report Q4',
        version_number: 1,
      });
    });

    it('should NOT add report to responseMessages when it does NOT contain metrics', async () => {
      // Setup state with a successful report
      state.files = [
        {
          id: 'report-2',
          file_name: 'Simple Report',
          file_type: 'report',
          version_number: 1,
          status: 'completed',
        },
      ];

      const input: CreateReportsInput = {
        files: [
          {
            name: 'Simple Report',
            content: `
              # Simple Report
              This report has no metrics, just text analysis.
            `,
          },
        ],
      };

      // Mock that the report does NOT contain metrics
      mockReportContainsMetrics.mockReturnValue(false);

      const execute = createCreateReportsExecute(context, state);
      await execute(input);

      // Check that updateMessageEntries was called WITHOUT responseMessages
      expect(mockUpdateMessageEntries).toHaveBeenCalled();
      const updateCall = mockUpdateMessageEntries.mock.calls[0]?.[0];

      expect(updateCall?.responseMessages).toBeUndefined();
      // But reasoning and raw messages should still be there
      expect(updateCall.reasoningMessages).toBeDefined();
      expect(updateCall.rawLlmMessages).toBeDefined();
    });

    it('should handle multiple reports with mixed metric presence', async () => {
      // Setup state with multiple reports
      state.files = [
        {
          id: 'report-1',
          file_name: 'Report With Metrics',
          file_type: 'report',
          version_number: 1,
          status: 'completed',
        },
        {
          id: 'report-2',
          file_name: 'Report Without Metrics',
          file_type: 'report',
          version_number: 1,
          status: 'completed',
        },
        {
          id: 'report-3',
          file_name: 'Another Report With Metrics',
          file_type: 'report',
          version_number: 1,
          status: 'completed',
        },
      ];

      const input: CreateReportsInput = {
        files: [
          {
            name: 'Report With Metrics',
            content: '<metric metricId="uuid-1" />',
          },
          {
            name: 'Report Without Metrics',
            content: 'Just text',
          },
          {
            name: 'Another Report With Metrics',
            content: '<metric metricId="uuid-2" />',
          },
        ],
      };

      // Mock metric detection for each report
      mockReportContainsMetrics
        .mockReturnValueOnce(true) // First report has metrics
        .mockReturnValueOnce(false) // Second report has no metrics
        .mockReturnValueOnce(true); // Third report has metrics

      const execute = createCreateReportsExecute(context, state);
      await execute(input);

      // Check that only reports with metrics were added to responseMessages
      expect(mockUpdateMessageEntries).toHaveBeenCalled();
      // Get the last call (final entries) which should have responseMessages
      const lastCallIndex = mockUpdateMessageEntries.mock.calls.length - 1;
      const updateCall = mockUpdateMessageEntries.mock.calls[lastCallIndex]?.[0];

      expect(updateCall?.responseMessages).toBeDefined();
      expect(updateCall?.responseMessages).toHaveLength(2); // Only 2 reports with metrics

      const responseIds = updateCall?.responseMessages?.map((msg: any) => msg.id) || [];
      expect(responseIds).toContain('report-1');
      expect(responseIds).toContain('report-3');
      expect(responseIds).not.toContain('report-2');
    });

    it('should create initial entries on first execution', async () => {
      state.initialEntriesCreated = undefined;
      state.files = [];

      const input: CreateReportsInput = {
        files: [
          {
            name: 'Test Report',
            content: 'Test content',
          },
        ],
      };

      const execute = createCreateReportsExecute(context, state);
      await execute(input);

      // Should be called twice - once for initial entries, once for final
      expect(mockUpdateMessageEntries).toHaveBeenCalledTimes(2);

      // First call should be initial entries
      const firstCall = mockUpdateMessageEntries.mock.calls[0]?.[0];
      expect(firstCall.messageId).toBe('msg-001');
      expect(firstCall.reasoningMessages).toBeDefined();
      expect(firstCall.rawLlmMessages).toBeDefined();

      // State should be updated
      expect(state.initialEntriesCreated).toBe(true);
    });

    it('should not create initial entries if already created', async () => {
      state.initialEntriesCreated = true;
      state.files = [
        {
          id: 'report-1',
          file_name: 'Test Report',
          file_type: 'report',
          version_number: 1,
          status: 'completed',
        },
      ];

      const input: CreateReportsInput = {
        files: [
          {
            name: 'Test Report',
            content: '<metric metricId="uuid-1" />',
          },
        ],
      };

      mockReportContainsMetrics.mockReturnValue(true);

      const execute = createCreateReportsExecute(context, state);
      await execute(input);

      // Should only be called once for final entries
      expect(mockUpdateMessageEntries).toHaveBeenCalledTimes(1);
    });

    it('should handle reports with failed status', async () => {
      state.files = [
        {
          id: 'report-1',
          file_name: 'Success Report',
          file_type: 'report',
          version_number: 1,
          status: 'completed',
        },
        {
          id: 'report-2',
          file_name: 'Failed Report',
          file_type: 'report',
          version_number: 1,
          status: 'failed',
        },
      ];

      const input: CreateReportsInput = {
        files: [
          {
            name: 'Success Report',
            content: '<metric metricId="uuid-1" />',
          },
          {
            name: 'Failed Report',
            content: '<metric metricId="uuid-2" />',
          },
        ],
      };

      mockReportContainsMetrics.mockReturnValue(true);

      const execute = createCreateReportsExecute(context, state);
      const result = await execute(input);

      // Result should show one success and one failure
      expect(result.files).toHaveLength(1);
      expect(result.failed_files).toHaveLength(1);

      // Only the successful report with metrics should be in responseMessages
      // Get the last call (final entries) which should have responseMessages
      const lastCallIndex = mockUpdateMessageEntries.mock.calls.length - 1;
      const updateCall = mockUpdateMessageEntries.mock.calls[lastCallIndex]?.[0];
      expect(updateCall?.responseMessages).toHaveLength(1);
      expect(updateCall?.responseMessages?.[0]?.id).toBe('report-1');
    });

    it('should handle missing messageId in context', async () => {
      // Remove messageId from context
      context.messageId = undefined;

      state.files = [
        {
          id: 'report-1',
          file_name: 'Test Report',
          file_type: 'report',
          version_number: 1,
          status: 'completed',
        },
      ];

      const input: CreateReportsInput = {
        files: [
          {
            name: 'Test Report',
            content: '<metric metricId="uuid-1" />',
          },
        ],
      };

      mockReportContainsMetrics.mockReturnValue(true);

      const execute = createCreateReportsExecute(context, state);
      const result = await execute(input);

      // Should complete successfully but not call updateMessageEntries
      expect(result.files).toHaveLength(1);
      expect(mockUpdateMessageEntries).not.toHaveBeenCalled();
    });
  });
});
