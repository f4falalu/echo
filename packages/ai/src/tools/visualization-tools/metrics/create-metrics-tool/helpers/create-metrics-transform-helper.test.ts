import { describe, expect, it } from 'vitest';
import type { CreateMetricsState } from '../create-metrics-tool';
import {
  createCreateMetricsRawLlmMessageEntry,
  createCreateMetricsReasoningEntry,
} from './create-metrics-transform-helper';

describe('create-metrics-transform-helper', () => {
  describe('createCreateMetricsReasoningEntry', () => {
    it('should return undefined when no files exist', () => {
      const state: CreateMetricsState = {
        argsText: '',
        files: [],
        toolCallId: 'tool-123',
      };

      const result = createCreateMetricsReasoningEntry(state, 'tool-123');

      expect(result).toBeUndefined();
    });

    it('should create a reasoning entry with files', () => {
      const state: CreateMetricsState = {
        argsText: '',
        files: [
          {
            id: 'metric-1',
            file_name: 'test-metric',
            file_type: 'metric_file',
            version_number: 1,
            file: {
              text: 'test content',
            },
            status: 'loading',
          },
        ],
        toolCallId: 'tool-123',
      };

      const result = createCreateMetricsReasoningEntry(state, 'tool-123');

      expect(result).toBeDefined();
      expect(result?.type).toBe('files');
      if (result?.type === 'files') {
        expect(result).toMatchObject({
          id: 'tool-123',
          type: 'files',
          title: 'Creating metrics...',
          status: 'loading',
          file_ids: ['metric-1'],
          files: {
            'metric-1': {
              id: 'metric-1',
              file_type: 'metric_file',
              file_name: 'test-metric',
              version_number: 1,
              status: 'loading',
              file: {
                text: 'test content',
              },
            },
          },
        });
      }
    });

    it('should skip files without file_name', () => {
      const state: CreateMetricsState = {
        argsText: '',
        files: [
          {
            id: 'metric-1',
            file_name: undefined,
            file_type: 'metric_file',
            version_number: 1,
            file: {
              text: 'test content',
            },
            status: 'loading',
          },
          {
            id: 'metric-2',
            file_name: 'valid-metric',
            file_type: 'metric_file',
            version_number: 1,
            file: {
              text: 'valid content',
            },
            status: 'loading',
          },
        ],
        toolCallId: 'tool-123',
      };

      const result = createCreateMetricsReasoningEntry(state, 'tool-123');

      expect(result).toBeDefined();
      if (result?.type === 'files') {
        expect(result.file_ids).toEqual(['metric-2']);
        expect(Object.keys(result.files)).toEqual(['metric-2']);
      }
    });
  });

  describe('createCreateMetricsRawLlmMessageEntry', () => {
    it('should return undefined when no files exist', () => {
      const state: CreateMetricsState = {
        argsText: '',
        files: [],
        toolCallId: 'tool-123',
      };

      const result = createCreateMetricsRawLlmMessageEntry(state, 'tool-123');

      expect(result).toBeUndefined();
    });

    it('should create a raw LLM message entry', () => {
      const state: CreateMetricsState = {
        argsText: '',
        files: [
          {
            id: 'metric-1',
            file_name: 'test-metric',
            file_type: 'metric_file',
            version_number: 1,
            file: {
              text: 'test content',
            },
            status: 'loading',
          },
        ],
        toolCallId: 'tool-123',
      };

      const result = createCreateMetricsRawLlmMessageEntry(state, 'tool-123');

      expect(result).toMatchObject({
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'tool-123',
            toolName: 'createMetrics',
            input: {
              files: [
                {
                  name: 'test-metric',
                  yml_content: 'test content',
                },
              ],
            },
          },
        ],
      });
    });

    it('should filter out invalid entries', () => {
      const state: CreateMetricsState = {
        argsText: '',
        files: [
          {
            id: 'metric-1',
            file_name: '',
            file_type: 'metric_file',
            version_number: 1,
            file: {
              text: 'test content',
            },
            status: 'loading',
          },
          {
            id: 'metric-2',
            file_name: 'valid-metric',
            file_type: 'metric_file',
            version_number: 1,
            file: {
              text: '',
            },
            status: 'loading',
          },
          {
            id: 'metric-3',
            file_name: 'good-metric',
            file_type: 'metric_file',
            version_number: 1,
            file: {
              text: 'good content',
            },
            status: 'loading',
          },
        ],
        toolCallId: 'tool-123',
      };

      const result = createCreateMetricsRawLlmMessageEntry(state, 'tool-123');
      const input = (result?.content as any)[0]?.input;

      expect(input?.files).toHaveLength(1);
      expect(input?.files[0]).toEqual({
        name: 'good-metric',
        yml_content: 'good content',
      });
    });
  });
});
