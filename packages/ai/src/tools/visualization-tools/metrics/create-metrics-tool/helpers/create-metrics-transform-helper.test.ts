import { describe, expect, it } from 'vitest';
import type { CreateMetricsFile } from '../create-metrics-tool';
import {
  CREATE_METRICS_KEYS,
  createMetricsRawLlmMessageEntry,
  createMetricsReasoningMessage,
  createMetricsResponseMessage,
  extractMetricsFileInfo,
  updateMetricsProgressMessage,
} from './create-metrics-transform-helper';

describe('create-metrics-transform-helper', () => {
  describe('createMetricsReasoningMessage', () => {
    it('should create a reasoning message with loading status', () => {
      const files: CreateMetricsFile[] = [
        { name: 'test-metric', yml_content: 'test content', status: 'processing' },
      ];

      const result = createMetricsReasoningMessage('tool-123', files, 'loading');

      expect(result).toMatchObject({
        id: 'tool-123',
        type: 'files',
        title: 'Building new metrics...',
        status: 'loading',
        file_ids: expect.any(Array),
        files: expect.any(Object),
      });
      expect(result.file_ids).toHaveLength(1);
    });

    it('should create a completed message with success count', () => {
      const files: CreateMetricsFile[] = [
        { name: 'metric1', yml_content: 'content1', status: 'completed', id: 'id1', version: 1 },
        { name: 'metric2', yml_content: 'content2', status: 'completed', id: 'id2', version: 1 },
      ];

      const result = createMetricsReasoningMessage('tool-123', files, 'completed');

      expect(result.title).toBe('Created 2 metrics');
      expect(result.status).toBe('completed');
    });

    it('should handle mixed success and failure', () => {
      const files: CreateMetricsFile[] = [
        { name: 'metric1', yml_content: 'content1', status: 'completed', id: 'id1' },
        { name: 'metric2', yml_content: 'content2', status: 'failed', error: 'Failed to save' },
      ];

      const result = createMetricsReasoningMessage('tool-123', files, 'completed');

      expect(result.title).toBe('Created 1 metric, 1 failed');
    });

    it('should handle all failed', () => {
      const files: CreateMetricsFile[] = [
        { name: 'metric1', yml_content: 'content1', status: 'failed', error: 'Error 1' },
        { name: 'metric2', yml_content: 'content2', status: 'failed', error: 'Error 2' },
      ];

      const result = createMetricsReasoningMessage('tool-123', files, 'failed');

      expect(result.title).toBe('Failed to create metrics');
      expect(result.status).toBe('failed');
    });
  });

  describe('createMetricsResponseMessage', () => {
    it('should create a response message', () => {
      const result = createMetricsResponseMessage('tool-123', 'Processing metrics...');

      expect(result).toEqual({
        id: 'tool-123',
        type: 'text',
        message: 'Processing metrics...',
        is_final_message: false,
      });
    });
  });

  describe('createMetricsRawLlmMessageEntry', () => {
    it('should create raw LLM message entry with args', () => {
      const args = {
        files: [{ name: 'test', yml_content: 'content' }],
      };

      const result = createMetricsRawLlmMessageEntry('tool-123', 'create-metrics', args);

      expect(result).toEqual({
        type: 'tool-call',
        toolCallId: 'tool-123',
        toolName: 'create-metrics',
        args,
      });
    });

    it('should handle undefined args', () => {
      const result = createMetricsRawLlmMessageEntry('tool-123', 'create-metrics', undefined);

      expect(result.args).toEqual({});
    });
  });

  describe('updateMetricsProgressMessage', () => {
    it('should show starting message when no files processed', () => {
      const files: CreateMetricsFile[] = [
        { name: 'metric1', yml_content: '', status: 'processing' },
      ];

      const result = updateMetricsProgressMessage(files);

      expect(result).toBe('Starting metric creation...');
    });

    it('should show progress when partially processed', () => {
      const files: CreateMetricsFile[] = [
        { name: 'metric1', yml_content: 'content1', status: 'processing' },
        { name: 'metric2', yml_content: '', status: 'processing' },
        { name: 'metric3', yml_content: '', status: 'processing' },
      ];

      const result = updateMetricsProgressMessage(files);

      expect(result).toBe('Processing metrics... (1/3)');
    });

    it('should show completed message when all processed', () => {
      const files: CreateMetricsFile[] = [
        { name: 'metric1', yml_content: 'content1', status: 'completed' },
        { name: 'metric2', yml_content: 'content2', status: 'completed' },
      ];

      const result = updateMetricsProgressMessage(files);

      expect(result).toBe('Processed 2 metrics');
    });

    it('should handle single metric', () => {
      const files: CreateMetricsFile[] = [
        { name: 'metric1', yml_content: 'content1', status: 'completed' },
      ];

      const result = updateMetricsProgressMessage(files);

      expect(result).toBe('Processed 1 metric');
    });
  });

  describe('extractMetricsFileInfo', () => {
    it('should extract successful and failed files', () => {
      const files: CreateMetricsFile[] = [
        { name: 'metric1', yml_content: 'content1', status: 'completed', id: 'id1', version: 1 },
        { name: 'metric2', yml_content: 'content2', status: 'failed', error: 'Error message' },
        { name: 'metric3', yml_content: 'content3', status: 'completed', id: 'id3', version: 2 },
      ];

      const result = extractMetricsFileInfo(files);

      expect(result.successfulFiles).toHaveLength(2);
      expect(result.successfulFiles[0]).toEqual({
        id: 'id1',
        name: 'metric1',
        version: 1,
      });
      expect(result.successfulFiles[1]).toEqual({
        id: 'id3',
        name: 'metric3',
        version: 2,
      });

      expect(result.failedFiles).toHaveLength(1);
      expect(result.failedFiles[0]).toEqual({
        name: 'metric2',
        error: 'Error message',
      });
    });

    it('should handle files without version', () => {
      const files: CreateMetricsFile[] = [
        { name: 'metric1', yml_content: 'content1', status: 'completed', id: 'id1' },
      ];

      const result = extractMetricsFileInfo(files);

      expect(result.successfulFiles[0].version).toBe(1);
    });

    it('should handle files without error message', () => {
      const files: CreateMetricsFile[] = [
        { name: 'metric1', yml_content: 'content1', status: 'failed' },
      ];

      const result = extractMetricsFileInfo(files);

      expect(result.failedFiles[0].error).toBe('Unknown error');
    });
  });

  describe('CREATE_METRICS_KEYS', () => {
    it('should have correct key mappings', () => {
      expect(CREATE_METRICS_KEYS.files).toBe('files');
      expect(CREATE_METRICS_KEYS.name).toBe('name');
      expect(CREATE_METRICS_KEYS.yml_content).toBe('yml_content');
    });
  });
});
