import { randomUUID } from 'node:crypto';
import type { ModelMessage } from 'ai';
import { describe, expect, test } from 'vitest';
import { CREATE_DASHBOARDS_TOOL_NAME } from '../../../visualization-tools/dashboards/create-dashboards-tool/create-dashboards-tool';
import { MODIFY_DASHBOARDS_TOOL_NAME } from '../../../visualization-tools/dashboards/modify-dashboards-tool/modify-dashboards-tool';
import { CREATE_METRICS_TOOL_NAME } from '../../../visualization-tools/metrics/create-metrics-tool/create-metrics-tool';
import { MODIFY_METRICS_TOOL_NAME } from '../../../visualization-tools/metrics/modify-metrics-tool/modify-metrics-tool';
import { CREATE_REPORTS_TOOL_NAME } from '../../../visualization-tools/reports/create-reports-tool/create-reports-tool';
import { MODIFY_REPORTS_TOOL_NAME } from '../../../visualization-tools/reports/modify-reports-tool/modify-reports-tool';
import { extractFilesFromToolCalls } from './done-tool-file-selection';

describe('done-tool-file-selection', () => {
  describe('extractFilesFromToolCalls', () => {
    test('should extract metrics from create metrics tool result', () => {
      const fileId = randomUUID();
      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: fileId,
                      name: 'Revenue Analysis',
                      version_number: 1,
                    },
                  ],
                  message: 'Metrics created successfully',
                }),
              },
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'tool-123',
            },
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);

      expect(extractedFiles).toHaveLength(1);
      expect(extractedFiles[0]).toMatchObject({
        id: fileId,
        fileType: 'metric',
        fileName: 'Revenue Analysis',
        status: 'completed',
        operation: 'created',
        versionNumber: 1,
      });
    });

    test('should extract dashboards from create dashboards tool result', () => {
      const fileId = randomUUID();
      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: fileId,
                      name: 'Sales Dashboard',
                      version_number: 1,
                    },
                  ],
                  message: 'Dashboard created successfully',
                }),
              },
              toolName: CREATE_DASHBOARDS_TOOL_NAME,
              toolCallId: 'tool-456',
            },
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);

      expect(extractedFiles).toHaveLength(1);
      expect(extractedFiles[0]).toMatchObject({
        id: fileId,
        fileType: 'dashboard',
        fileName: 'Sales Dashboard',
        status: 'completed',
        operation: 'created',
        versionNumber: 1,
      });
    });

    test('should extract reports from create reports tool result', () => {
      const fileId = randomUUID();
      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: fileId,
                      name: 'Q4 Analysis Report',
                      version_number: 1,
                    },
                  ],
                  message: 'Report created successfully',
                }),
              },
              toolName: CREATE_REPORTS_TOOL_NAME,
              toolCallId: 'tool-789',
            },
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);

      expect(extractedFiles).toHaveLength(1);
      expect(extractedFiles[0]).toMatchObject({
        id: fileId,
        fileType: 'report',
        fileName: 'Q4 Analysis Report',
        status: 'completed',
        operation: 'created',
        versionNumber: 1,
      });
    });

    test('should handle modify metrics tool result', () => {
      const fileId = randomUUID();
      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: fileId,
                      name: 'Updated Metric',
                      version_number: 2,
                    },
                  ],
                  message: 'Metric modified successfully',
                }),
              },
              toolName: MODIFY_METRICS_TOOL_NAME,
              toolCallId: 'tool-abc',
            },
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);

      expect(extractedFiles).toHaveLength(1);
      expect(extractedFiles[0]).toMatchObject({
        id: fileId,
        fileType: 'metric',
        fileName: 'Updated Metric',
        status: 'completed',
        operation: 'modified',
        versionNumber: 2,
      });
    });

    test('should handle modify dashboards tool result', () => {
      const fileId = randomUUID();
      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: fileId,
                      name: 'Updated Dashboard',
                      version_number: 2,
                    },
                  ],
                  message: 'Dashboard modified successfully',
                }),
              },
              toolName: MODIFY_DASHBOARDS_TOOL_NAME,
              toolCallId: 'tool-def',
            },
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);

      expect(extractedFiles).toHaveLength(1);
      expect(extractedFiles[0]).toMatchObject({
        id: fileId,
        fileType: 'dashboard',
        fileName: 'Updated Dashboard',
        status: 'completed',
        operation: 'modified',
        versionNumber: 2,
      });
    });

    test('should handle modify reports tool result with different structure', () => {
      const fileId = randomUUID();
      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  success: true,
                  message: 'Report modified successfully',
                  file: {
                    id: fileId,
                    name: 'Updated Report',
                    content: 'Report content',
                    version_number: 2,
                    updated_at: new Date().toISOString(),
                  },
                }),
              },
              toolName: MODIFY_REPORTS_TOOL_NAME,
              toolCallId: 'tool-ghi',
            },
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);

      expect(extractedFiles).toHaveLength(1);
      expect(extractedFiles[0]).toMatchObject({
        id: fileId,
        fileType: 'report',
        fileName: 'Updated Report',
        status: 'completed',
        operation: 'modified',
        versionNumber: 2,
      });
    });

    test('should deduplicate files by version number', () => {
      const fileId = randomUUID();
      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: fileId,
                      name: 'Test Metric',
                      version_number: 1,
                    },
                  ],
                  message: 'Created',
                }),
              },
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'tool-1',
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: fileId,
                      name: 'Test Metric Updated',
                      version_number: 2,
                    },
                  ],
                  message: 'Modified',
                }),
              },
              toolName: MODIFY_METRICS_TOOL_NAME,
              toolCallId: 'tool-2',
            },
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);

      expect(extractedFiles).toHaveLength(1);
      expect(extractedFiles[0]?.versionNumber).toBe(2);
      expect(extractedFiles[0]?.fileName).toBe('Test Metric Updated');
      expect(extractedFiles[0]?.operation).toBe('modified');
    });

    test('should handle multiple files in a single tool result', () => {
      const fileId1 = randomUUID();
      const fileId2 = randomUUID();
      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: fileId1,
                      name: 'Metric 1',
                      version_number: 1,
                    },
                    {
                      id: fileId2,
                      name: 'Metric 2',
                      version_number: 1,
                    },
                  ],
                  message: 'Metrics created successfully',
                }),
              },
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'tool-multi',
            },
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);

      expect(extractedFiles).toHaveLength(2);
      expect(extractedFiles[0]?.fileName).toBe('Metric 1');
      expect(extractedFiles[1]?.fileName).toBe('Metric 2');
    });

    test('should handle empty messages array', () => {
      const extractedFiles = extractFilesFromToolCalls([]);
      expect(extractedFiles).toEqual([]);
    });

    test('should ignore messages without tool results', () => {
      const mockMessages: ModelMessage[] = [
        {
          role: 'user',
          content: 'Create a metric',
        },
        {
          role: 'assistant',
          content: 'I will create a metric for you',
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);
      expect(extractedFiles).toEqual([]);
    });

    test('should handle invalid JSON in tool result', () => {
      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: 'invalid json',
              },
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'tool-invalid',
            },
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);
      expect(extractedFiles).toEqual([]);
    });

    test('should ignore unknown tool names', () => {
      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: randomUUID(),
                      name: 'Some File',
                      version_number: 1,
                    },
                  ],
                }),
              },
              toolName: 'unknownTool',
              toolCallId: 'tool-unknown',
            },
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);
      expect(extractedFiles).toEqual([]);
    });

    test('should filter out reports from final selection', () => {
      const reportId = randomUUID();
      const metricId = randomUUID();
      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: reportId,
                      name: 'Strategic Report',
                      version_number: 1,
                    },
                  ],
                }),
              },
              toolName: CREATE_REPORTS_TOOL_NAME,
              toolCallId: 'tool-report',
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: metricId,
                      name: 'Standalone Metric',
                      version_number: 1,
                    },
                  ],
                }),
              },
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'tool-metric',
            },
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);

      // Reports should be filtered out
      expect(extractedFiles.find((f) => f.fileType === 'report')).toBeUndefined();
      // Standalone metrics should remain
      expect(extractedFiles).toHaveLength(1);
      expect(extractedFiles[0]).toMatchObject({
        id: metricId,
        fileType: 'metric',
        fileName: 'Standalone Metric',
      });
    });

    test('should filter out metrics that are referenced in reports', () => {
      const reportId = randomUUID();
      const metricInReportId = randomUUID();
      const standaloneMetricId = randomUUID();

      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  files: [
                    {
                      id: metricInReportId,
                      name: 'Metric in Report',
                      version_number: 1,
                    },
                    {
                      id: standaloneMetricId,
                      name: 'Standalone Metric',
                      version_number: 1,
                    },
                  ],
                }),
              },
              toolName: CREATE_METRICS_TOOL_NAME,
              toolCallId: 'tool-metrics',
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              output: {
                type: 'json',
                value: JSON.stringify({
                  file: {
                    id: reportId,
                    name: 'Report with Metrics',
                    version_number: 1,
                    content: `This report includes <metric metricId="${metricInReportId}" />`,
                  },
                }),
              },
              toolName: MODIFY_REPORTS_TOOL_NAME,
              toolCallId: 'tool-report',
            },
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);

      // Reports should be filtered out
      expect(extractedFiles.find((f) => f.id === reportId)).toBeUndefined();
      // Metrics referenced in reports should be filtered out
      expect(extractedFiles.find((f) => f.id === metricInReportId)).toBeUndefined();
      // Standalone metrics should remain
      expect(extractedFiles).toHaveLength(1);
      expect(extractedFiles[0]).toMatchObject({
        id: standaloneMetricId,
        fileType: 'metric',
        fileName: 'Standalone Metric',
      });
    });
  });
});
