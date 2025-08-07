import { describe, expect, it } from 'vitest';
import type { ModifyMetricsFile } from '../modify-metrics-tool';
import {
  MODIFY_METRICS_KEYS,
  createModifyMetricsRawLlmMessageEntry,
  createModifyMetricsReasoningMessage,
  createModifyMetricsResponseMessage,
  extractModifyMetricsFileInfo,
  updateModifyMetricsProgressMessage,
} from './modify-metrics-tool-transform-helper';

describe('modify-metrics-tool-transform-helper', () => {
  describe('createModifyMetricsReasoningMessage', () => {
    it('should create a reasoning message with loading status', () => {
      const files: ModifyMetricsFile[] = [
        {
          id: 'metric-1',
          yml_content: 'name: Test Metric',
          name: 'Test Metric',
          status: 'processing',
        },
      ];

      const result = createModifyMetricsReasoningMessage('tool-123', files, 'loading');

      expect(result).toEqual({
        id: 'tool-123',
        type: 'files',
        title: 'Modifying metrics...',
        status: 'loading',
        file_ids: ['metric-1'],
        files: {
          'metric-1': {
            id: 'metric-1',
            file_type: 'metric',
            file_name: 'Test Metric',
            version_number: undefined,
            status: 'processing',
            file: {
              text: 'name: Test Metric',
            },
          },
        },
      });
    });

    it('should create a reasoning message with completed status and success count', () => {
      const files: ModifyMetricsFile[] = [
        {
          id: 'metric-1',
          yml_content: 'content1',
          name: 'Metric 1',
          status: 'completed',
          version: 2,
        },
        {
          id: 'metric-2',
          yml_content: 'content2',
          name: 'Metric 2',
          status: 'completed',
          version: 3,
        },
      ];

      const result = createModifyMetricsReasoningMessage('tool-123', files, 'completed');

      expect(result.title).toBe('Modified 2 metrics');
      expect(result.status).toBe('completed');
    });

    it('should handle mixed success and failure', () => {
      const files: ModifyMetricsFile[] = [
        {
          id: 'metric-1',
          yml_content: 'content1',
          status: 'completed',
        },
        {
          id: 'metric-2',
          yml_content: 'content2',
          status: 'failed',
          error: 'Validation error',
        },
      ];

      const result = createModifyMetricsReasoningMessage('tool-123', files, 'completed');

      expect(result.title).toBe('Modified 1 metric, 1 failed');
      expect(result.files['metric-2'].error).toBe('Validation error');
    });

    it('should handle empty files array', () => {
      const result = createModifyMetricsReasoningMessage('tool-123', [], 'loading');

      expect(result.file_ids).toEqual([]);
      expect(result.files).toEqual({});
    });

    it('should use fallback name when name is not provided', () => {
      const files: ModifyMetricsFile[] = [
        {
          id: 'metric-1',
          yml_content: 'content',
          status: 'processing',
        },
      ];

      const result = createModifyMetricsReasoningMessage('tool-123', files, 'loading');

      expect(result.files['metric-1'].file_name).toBe('Metric metric-1');
    });
  });

  describe('createModifyMetricsResponseMessage', () => {
    it('should create a response message', () => {
      const result = createModifyMetricsResponseMessage(
        'tool-123',
        'Metrics modified successfully'
      );

      expect(result).toEqual({
        id: 'tool-123',
        type: 'text',
        message: 'Metrics modified successfully',
        is_final_message: false,
      });
    });
  });

  describe('createModifyMetricsRawLlmMessageEntry', () => {
    it('should create raw LLM message entry with args', () => {
      const args = {
        files: [
          {
            id: 'metric-1',
            yml_content: 'content',
          },
        ],
      };

      const result = createModifyMetricsRawLlmMessageEntry('tool-123', 'modify-metrics', args);

      expect(result).toEqual({
        type: 'tool-call',
        toolCallId: 'tool-123',
        toolName: 'modify-metrics',
        args,
      });
    });

    it('should handle undefined args', () => {
      const result = createModifyMetricsRawLlmMessageEntry('tool-123', 'modify-metrics', undefined);

      expect(result.args).toEqual({});
    });
  });

  describe('updateModifyMetricsProgressMessage', () => {
    it('should return starting message when no files have content', () => {
      const files: ModifyMetricsFile[] = [
        { id: 'metric-1', yml_content: '', status: 'processing' },
      ];

      const result = updateModifyMetricsProgressMessage(files);

      expect(result).toBe('Starting metric modification...');
    });

    it('should return progress message when partially processed', () => {
      const files: ModifyMetricsFile[] = [
        { id: 'metric-1', yml_content: 'content1', status: 'processing' },
        { id: 'metric-2', yml_content: '', status: 'processing' },
        { id: 'metric-3', yml_content: 'content3', status: 'processing' },
      ];

      const result = updateModifyMetricsProgressMessage(files);

      expect(result).toBe('Processing metrics... (2/3)');
    });

    it('should return completed message when all processed', () => {
      const files: ModifyMetricsFile[] = [
        { id: 'metric-1', yml_content: 'content1', status: 'completed' },
        { id: 'metric-2', yml_content: 'content2', status: 'completed' },
      ];

      const result = updateModifyMetricsProgressMessage(files);

      expect(result).toBe('Processed 2 metrics');
    });

    it('should handle single metric', () => {
      const files: ModifyMetricsFile[] = [
        { id: 'metric-1', yml_content: 'content', status: 'completed' },
      ];

      const result = updateModifyMetricsProgressMessage(files);

      expect(result).toBe('Processed 1 metric');
    });

    it('should handle empty array', () => {
      const result = updateModifyMetricsProgressMessage([]);

      expect(result).toBe('Starting metric modification...');
    });
  });

  describe('extractModifyMetricsFileInfo', () => {
    it('should extract successful and failed files', () => {
      const files: ModifyMetricsFile[] = [
        {
          id: 'metric-1',
          yml_content: 'content1',
          name: 'Metric 1',
          status: 'completed',
          version: 2,
        },
        {
          id: 'metric-2',
          yml_content: 'content2',
          name: 'Metric 2',
          status: 'failed',
          error: 'Validation error',
        },
        {
          id: 'metric-3',
          yml_content: 'content3',
          name: 'Metric 3',
          status: 'completed',
          version: 1,
        },
      ];

      const result = extractModifyMetricsFileInfo(files);

      expect(result.successfulFiles).toHaveLength(2);
      expect(result.successfulFiles[0]).toEqual({
        id: 'metric-1',
        name: 'Metric 1',
        version: 2,
      });
      expect(result.successfulFiles[1]).toEqual({
        id: 'metric-3',
        name: 'Metric 3',
        version: 1,
      });

      expect(result.failedFiles).toHaveLength(1);
      expect(result.failedFiles[0]).toEqual({
        id: 'metric-2',
        name: 'Metric 2',
        error: 'Validation error',
      });
    });

    it('should handle files without names', () => {
      const files: ModifyMetricsFile[] = [
        {
          id: 'metric-1',
          yml_content: 'content',
          status: 'completed',
        },
      ];

      const result = extractModifyMetricsFileInfo(files);

      expect(result.successfulFiles[0].name).toBe('Metric metric-1');
    });

    it('should use default version when not provided', () => {
      const files: ModifyMetricsFile[] = [
        {
          id: 'metric-1',
          yml_content: 'content',
          status: 'completed',
          name: 'Test',
        },
      ];

      const result = extractModifyMetricsFileInfo(files);

      expect(result.successfulFiles[0].version).toBe(1);
    });

    it('should handle empty array', () => {
      const result = extractModifyMetricsFileInfo([]);

      expect(result.successfulFiles).toEqual([]);
      expect(result.failedFiles).toEqual([]);
    });
  });

  describe('MODIFY_METRICS_KEYS', () => {
    it('should have correct key mappings', () => {
      expect(MODIFY_METRICS_KEYS.files).toBe('files');
      expect(MODIFY_METRICS_KEYS.id).toBe('id');
      expect(MODIFY_METRICS_KEYS.yml_content).toBe('yml_content');
      expect(MODIFY_METRICS_KEYS.name).toBe('name');
    });
  });
});
