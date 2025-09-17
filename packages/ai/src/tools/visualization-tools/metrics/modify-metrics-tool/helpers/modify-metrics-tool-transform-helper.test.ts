import { describe, expect, it } from 'vitest';
import type { ModifyMetricStateFile, ModifyMetricsState } from '../modify-metrics-tool';
import {
  createModifyMetricsRawLlmMessageEntry,
  createModifyMetricsReasoningEntry,
} from './modify-metrics-tool-transform-helper';

describe('modify-metrics-tool-transform-helper', () => {
  describe('createModifyMetricsReasoningEntry', () => {
    it('should create a reasoning entry with loading status', () => {
      const state: ModifyMetricsState = {
        toolCallId: undefined,
        argsText: undefined,
        files: [
          {
            id: 'metric-1',
            file_type: 'metric_file',
            file_name: 'Test Metric',
            version_number: 1,
            status: 'loading',
            yml_content: 'name: Test Metric',
            file: {
              text: 'name: Test Metric',
            },
          },
        ],
      };

      const result = createModifyMetricsReasoningEntry(state, 'tool-123');

      expect(result).toEqual({
        id: 'tool-123',
        type: 'files',
        title: 'Modifying metrics...',
        status: 'loading',
        file_ids: ['metric-1'],
        files: {
          'metric-1': {
            id: 'metric-1',
            file_type: 'metric_file',
            file_name: 'Test Metric',
            version_number: 1,
            status: 'loading',
            file: {
              text: 'name: Test Metric',
            },
          },
        },
      });
    });

    it('should create a reasoning entry with completed status', () => {
      const state: ModifyMetricsState = {
        toolCallId: undefined,
        argsText: undefined,
        files: [
          {
            id: 'metric-1',
            file_type: 'metric_file',
            file_name: 'Metric 1',
            version_number: 2,
            status: 'completed',
            yml_content: 'content1',
          },
          {
            id: 'metric-2',
            file_type: 'metric_file',
            file_name: 'Metric 2',
            version_number: 3,
            status: 'completed',
            yml_content: 'content2',
          },
        ],
      };

      const result = createModifyMetricsReasoningEntry(state, 'tool-123');

      expect(result?.title).toBe('Modified 2 metrics');
      expect(result?.status).toBe('completed');
    });

    it('should handle mixed success and failure', () => {
      const state: ModifyMetricsState = {
        toolCallId: undefined,
        argsText: undefined,
        files: [
          {
            id: 'metric-1',
            file_type: 'metric_file',
            file_name: 'Metric 1',
            version_number: 1,
            status: 'completed',
            yml_content: 'content1',
          },
          {
            id: 'metric-2',
            file_type: 'metric_file',
            file_name: 'Metric 2',
            version_number: 1,
            status: 'failed',
            yml_content: 'content2',
          },
        ],
      };

      const result = createModifyMetricsReasoningEntry(state, 'tool-123');

      expect(result?.title).toBe('Modified 1 metric, 1 failed');
      expect(result?.status).toBe('failed');
    });

    it('should return undefined for empty files array', () => {
      const state: ModifyMetricsState = {
        toolCallId: undefined,
        argsText: undefined,
        files: [],
      };

      const result = createModifyMetricsReasoningEntry(state, 'tool-123');

      expect(result).toBeUndefined();
    });

    it('should return undefined when files is undefined', () => {
      const state: ModifyMetricsState = {
        toolCallId: undefined,
        argsText: undefined,
        files: undefined,
      };

      const result = createModifyMetricsReasoningEntry(state, 'tool-123');

      expect(result).toBeUndefined();
    });
  });

  describe('createModifyMetricsRawLlmMessageEntry', () => {
    it('should create raw LLM message entry with files', () => {
      const state: ModifyMetricsState = {
        toolCallId: 'tool-123',
        argsText: undefined,
        files: [
          {
            id: 'metric-1',
            file_type: 'metric_file',
            file_name: 'Test Metric',
            version_number: 1,
            status: 'loading',
            yml_content: 'content',
          },
        ],
      };

      const result = createModifyMetricsRawLlmMessageEntry(state, 'tool-123');

      expect(result).toEqual({
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'tool-123',
            toolName: 'modifyMetrics',
            input: {
              files: [
                {
                  id: 'metric-1',
                  yml_content: 'content',
                },
              ],
            },
          },
        ],
      });
    });

    it('should return undefined for empty files', () => {
      const state: ModifyMetricsState = {
        toolCallId: 'tool-123',
        argsText: undefined,
        files: [],
      };

      const result = createModifyMetricsRawLlmMessageEntry(state, 'tool-123');

      expect(result).toBeUndefined();
    });

    it('should filter out files without id or yml_content', () => {
      const state: ModifyMetricsState = {
        toolCallId: 'tool-123',
        argsText: undefined,
        files: [
          {
            id: 'metric-1',
            file_type: 'metric_file',
            file_name: 'Test 1',
            version_number: 1,
            status: 'loading',
            yml_content: 'content1',
          },
          {
            id: '',
            file_type: 'metric_file',
            file_name: 'Test 2',
            version_number: 1,
            status: 'loading',
            yml_content: 'content2',
          },
          {
            id: 'metric-3',
            file_type: 'metric_file',
            file_name: 'Test 3',
            version_number: 1,
            status: 'loading',
            yml_content: '',
          },
        ],
      };

      const result = createModifyMetricsRawLlmMessageEntry(state, 'tool-123');

      expect(result).toBeDefined();
      expect(result?.role).toBe('assistant');
      const content = result?.content[0];
      expect(content).toBeDefined();
      expect((content as any).type).toBe('tool-call');
      expect((content as any).input.files).toHaveLength(1);
      expect((content as any).input.files[0].id).toBe('metric-1');
    });
  });
});
