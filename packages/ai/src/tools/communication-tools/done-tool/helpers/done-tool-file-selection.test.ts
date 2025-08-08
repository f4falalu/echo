import { randomUUID } from 'node:crypto';
import type { ModelMessage } from 'ai';
import { describe, expect, test } from 'vitest';
import { extractFilesFromToolCalls } from './done-tool-file-selection';

describe('done-tool-file-selection', () => {
  describe('extractFilesFromToolCalls', () => {
    test('should handle file extraction from tool calls', () => {
      const mockMessages: ModelMessage[] = [
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call' as const,
              toolCallId: 'file-tool-123',
              toolName: 'create-metrics-file',
              input: {
                files: [
                  {
                    name: 'Revenue Analysis',
                    yml_content: 'name: Revenue\nsql: SELECT * FROM sales',
                  },
                ],
              },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              output: {
                files: [
                  {
                    id: randomUUID(),
                    name: 'Revenue Analysis',
                    file_type: 'metric',
                    yml_content: 'name: Revenue\\nsql: SELECT * FROM sales',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    version_number: 1,
                  },
                ],
                message: 'created',
              },
            } as any,
          ],
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);

      expect(extractedFiles).toHaveLength(1);
      expect(extractedFiles[0]).toMatchObject({
        fileType: 'metric',
        fileName: 'Revenue Analysis',
        status: 'completed',
        operation: 'created',
        versionNumber: 1,
      });
    });

    test('should extract dashboard files from tool calls', () => {
      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: {
            files: [
              {
                id: randomUUID(),
                name: 'Sales Dashboard',
                file_type: 'dashboard',
                yml_content: 'title: Sales Dashboard',
                version_number: 1,
              },
            ],
            message: 'Dashboard created successfully',
          } as any,
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);

      expect(extractedFiles).toHaveLength(1);
      expect(extractedFiles[0]).toMatchObject({
        fileType: 'dashboard',
        fileName: 'Sales Dashboard',
        status: 'completed',
        operation: 'created',
      });
    });

    test('should detect modified operation from message', () => {
      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: {
            files: [
              {
                id: randomUUID(),
                name: 'Updated Metric',
                file_type: 'metric',
                version_number: 2,
              },
            ],
            message: 'Metric modified successfully',
          } as any,
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);

      expect(extractedFiles).toHaveLength(1);
      expect(extractedFiles[0]?.operation).toBe('modified');
    });

    test('should deduplicate files by version number', () => {
      const fileId = randomUUID();
      const mockMessages: ModelMessage[] = [
        {
          role: 'tool',
          content: {
            files: [
              {
                id: fileId,
                name: 'Test Metric',
                file_type: 'metric',
                version_number: 1,
              },
            ],
            message: 'created',
          } as any,
        },
        {
          role: 'tool',
          content: {
            files: [
              {
                id: fileId,
                name: 'Test Metric Updated',
                file_type: 'metric',
                version_number: 2,
              },
            ],
            message: 'modified',
          } as any,
        },
      ];

      const extractedFiles = extractFilesFromToolCalls(mockMessages);

      expect(extractedFiles).toHaveLength(1);
      expect(extractedFiles[0]?.versionNumber).toBe(2);
      expect(extractedFiles[0]?.fileName).toBe('Test Metric Updated');
    });

    test('should handle empty messages array', () => {
      const extractedFiles = extractFilesFromToolCalls([]);
      expect(extractedFiles).toEqual([]);
    });

    test('should handle messages without tool results', () => {
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
  });
});
