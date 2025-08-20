import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createModifyReportsExecute } from './modify-reports-execute';
import type {
  ModifyReportsContext,
  ModifyReportsInput,
  ModifyReportsState,
} from './modify-reports-tool';

// Mock dependencies
const mockDbLimit = vi.fn();
const mockDbWhere = vi.fn();
const mockDbFrom = vi.fn();
const mockDbSelect = vi.fn();

vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn().mockResolvedValue({ success: true }),
  batchUpdateReport: vi.fn().mockResolvedValue({ success: true }),
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: mockDbLimit,
        }),
      }),
    }),
  },
  reportFiles: {},
}));

vi.mock('../helpers/report-metric-helper', () => ({
  reportContainsMetrics: vi.fn(),
}));

vi.mock('../helpers/report-version-helper', () => ({
  shouldIncrementVersion: vi.fn().mockResolvedValue(true),
  updateVersionHistory: vi.fn().mockReturnValue({
    versionHistory: {},
    newVersionNumber: 2,
  }),
}));

vi.mock('../../file-tracking-helper', () => ({
  trackFileAssociations: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('./helpers/modify-reports-transform-helper', () => ({
  createModifyReportsRawLlmMessageEntry: vi.fn().mockReturnValue({
    id: 'raw-llm-1',
    type: 'raw-llm',
    content: 'raw llm content',
  }),
  createModifyReportsReasoningEntry: vi.fn().mockReturnValue({
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

import { db, updateMessageEntries } from '@buster/database';
import { reportContainsMetrics } from '../helpers/report-metric-helper';

describe('modify-reports-execute', () => {
  let context: ModifyReportsContext;
  let state: ModifyReportsState;
  let mockUpdateMessageEntries: ReturnType<typeof vi.fn>;
  let mockReportContainsMetrics: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDbLimit.mockClear();
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
      edits: [],
      startTime: Date.now(),
    };
  });

  describe('responseMessages conditional logic', () => {
    it('should add report to responseMessages when modified report contains metrics', async () => {
      // Mock existing report in database
      const existingReportContent = '# Original Report\nSome content here.';
      const modifiedContent = `# Modified Report
<metric metricId="24db2cc8-79b0-488f-bd45-8b5412d1bf08" />
Updated content with metrics.`;

      mockDbLimit.mockResolvedValue([
        {
          content: existingReportContent,
          versionHistory: null,
        },
      ]);

      // Setup state
      state.edits = [
        {
          code_to_replace: '# Original Report\nSome content here.',
          code: modifiedContent,
          status: 'loading',
          operation: 'replace',
        },
      ];

      const input: ModifyReportsInput = {
        id: 'report-123',
        name: 'Modified Sales Report',
        edits: [
          {
            code_to_replace: '# Original Report\nSome content here.',
            code: modifiedContent,
          },
        ],
      };

      // Mock that the modified report contains metrics
      mockReportContainsMetrics.mockReturnValue(true);

      const execute = createModifyReportsExecute(context, state);
      const result = await execute(input);

      // Check result
      expect(result.success).toBe(true);
      expect(result.file.content).toBe(modifiedContent);

      // Check that updateMessageEntries was called with responseMessages
      expect(mockUpdateMessageEntries).toHaveBeenCalled();
      const updateCall = mockUpdateMessageEntries.mock.calls[0]?.[0];

      expect(updateCall.responseMessages).toBeDefined();
      expect(updateCall.responseMessages).toHaveLength(1);
      expect(updateCall.responseMessages[0]).toMatchObject({
        id: 'report-123',
        type: 'file',
        file_type: 'report',
        file_name: 'Modified Sales Report',
      });
    });

    it('should NOT add report to responseMessages when modified report does NOT contain metrics', async () => {
      // Mock existing report in database
      const existingReportContent = '# Original Report\nSome content here.';
      const modifiedContent = '# Modified Report\nUpdated content without any metrics.';

      mockDbLimit.mockResolvedValue([
        {
          content: existingReportContent,
          versionHistory: null,
        },
      ]);

      state.edits = [
        {
          code_to_replace: '# Original Report\nSome content here.',
          code: modifiedContent,
          status: 'loading',
          operation: 'replace',
        },
      ];

      const input: ModifyReportsInput = {
        id: 'report-123',
        name: 'Modified Report',
        edits: [
          {
            code_to_replace: '# Original Report\nSome content here.',
            code: modifiedContent,
          },
        ],
      };

      // Mock that the modified report does NOT contain metrics
      mockReportContainsMetrics.mockReturnValue(false);

      const execute = createModifyReportsExecute(context, state);
      const result = await execute(input);

      // Check result
      expect(result.success).toBe(true);

      // Check that updateMessageEntries was called WITHOUT responseMessages
      expect(mockUpdateMessageEntries).toHaveBeenCalled();
      const updateCall = mockUpdateMessageEntries.mock.calls[0]?.[0];

      expect(updateCall.responseMessages).toBeUndefined();
      // But reasoning and raw messages should still be there
      expect(updateCall.reasoningMessages).toBeDefined();
      expect(updateCall.rawLlmMessages).toBeDefined();
    });

    it('should check metrics on final content after all edits are applied', async () => {
      // Mock existing report
      const originalContent = '# Report\nSection 1\nSection 2\nSection 3';

      mockDbLimit.mockResolvedValue([
        {
          content: originalContent,
          versionHistory: null,
        },
      ]);

      // Multiple edits that eventually add a metric
      state.edits = [
        {
          code_to_replace: 'Section 1',
          code: 'Updated Section 1',
          status: 'loading',
          operation: 'replace',
        },
        {
          code_to_replace: 'Section 2',
          code: 'Section 2 with <metric metricId="uuid-123" />',
          status: 'loading',
          operation: 'replace',
        },
        {
          code_to_replace: 'Section 3',
          code: 'Updated Section 3',
          status: 'loading',
          operation: 'replace',
        },
      ];

      const input: ModifyReportsInput = {
        id: 'report-456',
        name: 'Multi-Edit Report',
        edits: [
          {
            code_to_replace: 'Section 1',
            code: 'Updated Section 1',
          },
          {
            code_to_replace: 'Section 2',
            code: 'Section 2 with <metric metricId="uuid-123" />',
          },
          {
            code_to_replace: 'Section 3',
            code: 'Updated Section 3',
          },
        ],
      };

      // Only check metrics on the final content
      mockReportContainsMetrics.mockImplementation((content: string) => {
        return content.includes('<metric metricId="uuid-123" />');
      });

      const execute = createModifyReportsExecute(context, state);
      const result = await execute(input);

      expect(result.success).toBe(true);

      // Should have called reportContainsMetrics with the final content
      expect(mockReportContainsMetrics).toHaveBeenCalledWith(
        expect.stringContaining('<metric metricId="uuid-123" />')
      );

      // Should add to responseMessages since final content has metrics
      const updateCall = mockUpdateMessageEntries.mock.calls[0]?.[0];
      expect(updateCall.responseMessages).toBeDefined();
      expect(updateCall.responseMessages).toHaveLength(1);
    });

    it('should handle failed edits and not add to responseMessages', async () => {
      // Mock existing report
      mockDbLimit.mockResolvedValue([
        {
          content: '# Original Report',
          versionHistory: null,
        },
      ]);

      state.edits = [
        {
          code_to_replace: 'Non-existent text',
          code: '<metric metricId="uuid-123" />',
          status: 'loading',
          operation: 'replace',
        },
      ];

      const input: ModifyReportsInput = {
        id: 'report-789',
        name: 'Failed Edit Report',
        edits: [
          {
            code_to_replace: 'Non-existent text',
            code: '<metric metricId="uuid-123" />',
          },
        ],
      };

      mockReportContainsMetrics.mockReturnValue(true);

      const execute = createModifyReportsExecute(context, state);
      const result = await execute(input);

      // Should fail because text to replace doesn't exist
      expect(result.success).toBe(false);
      expect(result.error).toContain('Text not found');

      // Should still update message entries, but no responseMessages for failed edits
      const updateCall = mockUpdateMessageEntries.mock.calls[0]?.[0];
      expect(updateCall.responseMessages).toBeUndefined();
    });

    it('should handle missing messageId in context', async () => {
      // Remove messageId from context
      context.messageId = undefined;

      mockDbLimit.mockResolvedValue([
        {
          content: 'Original',
          versionHistory: null,
        },
      ]);

      const input: ModifyReportsInput = {
        id: 'report-999',
        name: 'No Message ID Report',
        edits: [
          {
            code_to_replace: 'Original',
            code: 'Modified with <metric metricId="uuid-123" />',
          },
        ],
      };

      mockReportContainsMetrics.mockReturnValue(true);

      const execute = createModifyReportsExecute(context, state);
      const result = await execute(input);

      // Should complete successfully
      expect(result.success).toBe(true);

      // Should not call updateMessageEntries without messageId
      expect(mockUpdateMessageEntries).not.toHaveBeenCalled();
    });

    it('should handle report not found in database', async () => {
      // Mock no report found
      mockDbLimit.mockResolvedValue([]);

      const input: ModifyReportsInput = {
        id: 'non-existent-report',
        name: 'Ghost Report',
        edits: [
          {
            code_to_replace: 'something',
            code: 'something else',
          },
        ],
      };

      const execute = createModifyReportsExecute(context, state);
      const result = await execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Report not found');

      // Should still try to update message entries with failure status
      expect(mockUpdateMessageEntries).toHaveBeenCalled();
      const updateCall = mockUpdateMessageEntries.mock.calls[0]?.[0];
      expect(updateCall.responseMessages).toBeUndefined();
    });

    it('should only check metrics on successful modifications', async () => {
      // Setup two reports - one success, one failure
      mockDbLimit
        .mockResolvedValueOnce([
          {
            content: 'Original Content',
            versionHistory: null,
          },
        ])
        .mockResolvedValueOnce([]); // Second report not found

      // First execution - successful
      const input1: ModifyReportsInput = {
        id: 'success-report',
        name: 'Success Report',
        edits: [
          {
            code_to_replace: 'Original Content',
            code: 'Modified with <metric metricId="uuid-1" />',
          },
        ],
      };

      mockReportContainsMetrics.mockReturnValue(true);

      const execute1 = createModifyReportsExecute(context, { ...state });
      const result1 = await execute1(input1);

      expect(result1.success).toBe(true);
      expect(mockReportContainsMetrics).toHaveBeenCalledWith(
        'Modified with <metric metricId="uuid-1" />'
      );

      // Reset mocks for second execution
      vi.clearAllMocks();
      mockReportContainsMetrics = reportContainsMetrics as ReturnType<typeof vi.fn>;

      // Second execution - failure (report not found)
      const input2: ModifyReportsInput = {
        id: 'missing-report',
        name: 'Missing Report',
        edits: [
          {
            code_to_replace: 'anything',
            code: 'anything with <metric metricId="uuid-2" />',
          },
        ],
      };

      const execute2 = createModifyReportsExecute(context, { ...state });
      const result2 = await execute2(input2);

      expect(result2.success).toBe(false);
      // Should NOT check metrics for failed modifications
      expect(mockReportContainsMetrics).not.toHaveBeenCalled();
    });
  });
});
