import { describe, expect, it } from 'vitest';
import type { ModifyDashboardsFile } from '../modify-dashboards-tool';
import {
  TOOL_KEYS,
  createDashboardsRawLlmMessageEntry,
  createDashboardsReasoningMessage,
  createDashboardsResponseMessage,
  extractDashboardsFileInfo,
  updateDashboardsProgressMessage,
} from './modify-dashboards-transform-helper';

describe('modify-dashboards-transform-helper', () => {
  describe('createDashboardsReasoningMessage', () => {
    it('should create reasoning message with loading status', () => {
      const files: ModifyDashboardsFile[] = [
        { id: 'dash-1', yml_content: 'content1', status: 'processing' },
        { id: 'dash-2', yml_content: 'content2', status: 'processing' },
      ];

      const result = createDashboardsReasoningMessage('tool-123', files, 'loading');

      expect(result.id).toBe('tool-123');
      expect(result.type).toBe('files');
      expect(result.title).toBe('Modifying dashboards...');
      expect(result.status).toBe('loading');
      expect(result.file_ids).toEqual(['dash-1', 'dash-2']);
      expect(result.files['dash-1']).toMatchObject({
        id: 'dash-1',
        file_type: 'dashboard',
        file_name: 'Dashboard dash-1',
        status: 'processing',
        file: { text: 'content1' },
      });
    });

    it('should create reasoning message with completed status', () => {
      const files: ModifyDashboardsFile[] = [
        { id: 'dash-1', yml_content: 'content1', status: 'completed' },
        { id: 'dash-2', yml_content: 'content2', status: 'failed', error: 'Validation error' },
      ];

      const result = createDashboardsReasoningMessage('tool-123', files, 'completed');

      expect(result.title).toBe('Modified 1 dashboard, 1 failed');
      expect(result.status).toBe('completed');
      expect(result.files['dash-2']).toMatchObject({
        error: 'Validation error',
      });
    });

    it('should handle pluralization correctly', () => {
      const files: ModifyDashboardsFile[] = [
        { id: 'dash-1', yml_content: 'content1', status: 'completed' },
        { id: 'dash-2', yml_content: 'content2', status: 'completed' },
      ];

      const result = createDashboardsReasoningMessage('tool-123', files, 'completed');

      expect(result.title).toBe('Modified 2 dashboards');
    });

    it('should use dashboard name when provided', () => {
      const files: ModifyDashboardsFile[] = [
        { id: 'dash-1', name: 'Sales Dashboard', yml_content: 'content1', status: 'processing' },
      ];

      const result = createDashboardsReasoningMessage('tool-123', files, 'loading');

      expect(result.files['dash-1'].file_name).toBe('Sales Dashboard');
    });

    it('should include version number when provided', () => {
      const files: ModifyDashboardsFile[] = [
        { id: 'dash-1', yml_content: 'content1', status: 'completed', version: 3 },
      ];

      const result = createDashboardsReasoningMessage('tool-123', files, 'completed');

      expect(result.files['dash-1'].version_number).toBe(3);
    });
  });

  describe('createDashboardsResponseMessage', () => {
    it('should create response message', () => {
      const result = createDashboardsResponseMessage(
        'tool-123',
        'Dashboards modified successfully'
      );

      expect(result.id).toBe('tool-123');
      expect(result.type).toBe('text');
      expect(result.message).toBe('Dashboards modified successfully');
      expect(result.is_final_message).toBe(false);
    });
  });

  describe('createDashboardsRawLlmMessageEntry', () => {
    it('should create raw LLM message entry', () => {
      const args = {
        files: [
          { id: 'dash-1', yml_content: 'content1' },
          { id: 'dash-2', yml_content: 'content2' },
        ],
      };

      const result = createDashboardsRawLlmMessageEntry('tool-123', 'modify-dashboards', args);

      expect(result.type).toBe('tool-call');
      expect(result.toolCallId).toBe('tool-123');
      expect(result.toolName).toBe('modify-dashboards');
      expect(result.args).toEqual(args);
    });

    it('should handle undefined args', () => {
      const result = createDashboardsRawLlmMessageEntry('tool-123', 'modify-dashboards', undefined);

      expect(result.args).toEqual({});
    });
  });

  describe('updateDashboardsProgressMessage', () => {
    it('should show starting message when no content', () => {
      const files: ModifyDashboardsFile[] = [
        { id: 'dash-1', yml_content: '', status: 'processing' },
        { id: 'dash-2', yml_content: '', status: 'processing' },
      ];

      const result = updateDashboardsProgressMessage(files);

      expect(result).toBe('Starting dashboard modification...');
    });

    it('should show progress when partially processed', () => {
      const files: ModifyDashboardsFile[] = [
        { id: 'dash-1', yml_content: 'content1', status: 'processing' },
        { id: 'dash-2', yml_content: '', status: 'processing' },
      ];

      const result = updateDashboardsProgressMessage(files);

      expect(result).toBe('Processing dashboards... (1/2)');
    });

    it('should show completion when all processed', () => {
      const files: ModifyDashboardsFile[] = [
        { id: 'dash-1', yml_content: 'content1', status: 'completed' },
        { id: 'dash-2', yml_content: 'content2', status: 'completed' },
      ];

      const result = updateDashboardsProgressMessage(files);

      expect(result).toBe('Processed 2 dashboards');
    });

    it('should handle singular dashboard', () => {
      const files: ModifyDashboardsFile[] = [
        { id: 'dash-1', yml_content: 'content1', status: 'completed' },
      ];

      const result = updateDashboardsProgressMessage(files);

      expect(result).toBe('Processed 1 dashboard');
    });
  });

  describe('extractDashboardsFileInfo', () => {
    it('should extract successful and failed files', () => {
      const files: ModifyDashboardsFile[] = [
        { id: 'dash-1', name: 'Sales', yml_content: 'content1', status: 'completed', version: 2 },
        {
          id: 'dash-2',
          name: 'Marketing',
          yml_content: 'content2',
          status: 'failed',
          error: 'Invalid YAML',
        },
        { id: 'dash-3', yml_content: 'content3', status: 'completed' },
      ];

      const result = extractDashboardsFileInfo(files);

      expect(result.successfulFiles).toHaveLength(2);
      expect(result.successfulFiles[0]).toEqual({
        id: 'dash-1',
        name: 'Sales',
        version: 2,
      });
      expect(result.successfulFiles[1]).toEqual({
        id: 'dash-3',
        name: 'Dashboard dash-3',
        version: 1,
      });

      expect(result.failedFiles).toHaveLength(1);
      expect(result.failedFiles[0]).toEqual({
        id: 'dash-2',
        error: 'Invalid YAML',
      });
    });

    it('should handle empty files array', () => {
      const result = extractDashboardsFileInfo([]);

      expect(result.successfulFiles).toHaveLength(0);
      expect(result.failedFiles).toHaveLength(0);
    });

    it('should use default values when properties are missing', () => {
      const files: ModifyDashboardsFile[] = [
        { id: 'dash-1', yml_content: 'content1', status: 'completed' },
        { id: 'dash-2', yml_content: 'content2', status: 'failed' },
      ];

      const result = extractDashboardsFileInfo(files);

      expect(result.successfulFiles[0].name).toBe('Dashboard dash-1');
      expect(result.successfulFiles[0].version).toBe(1);
      expect(result.failedFiles[0].error).toBe('Unknown error');
    });
  });

  describe('TOOL_KEYS', () => {
    it('should have correct key mappings', () => {
      expect(TOOL_KEYS.files).toBe('files');
      expect(TOOL_KEYS.id).toBe('id');
      expect(TOOL_KEYS.yml_content).toBe('yml_content');
    });
  });
});
