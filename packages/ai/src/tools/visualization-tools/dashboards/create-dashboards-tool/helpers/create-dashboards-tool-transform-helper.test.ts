import { describe, expect, it } from 'vitest';
import type { CreateDashboardsFile } from '../create-dashboards-tool';
import {
  TOOL_KEYS,
  createDashboardsRawLlmMessageEntry,
  createDashboardsReasoningMessage,
  createDashboardsResponseMessage,
  extractDashboardsFileInfo,
  updateDashboardsProgressMessage,
} from './create-dashboards-tool-transform-helper';

describe('create-dashboards-tool-transform-helper', () => {
  describe('createDashboardsReasoningMessage', () => {
    it('should create a reasoning message with loading status', () => {
      const files: CreateDashboardsFile[] = [
        { name: 'Dashboard 1', yml_content: 'content1', status: 'processing' },
        { name: 'Dashboard 2', yml_content: 'content2', status: 'processing' },
      ];

      const result = createDashboardsReasoningMessage('tool-123', files, 'loading');

      expect(result).toMatchObject({
        id: 'tool-123',
        type: 'files',
        title: 'Building new dashboards...',
        status: 'loading',
        file_ids: expect.any(Array),
        files: expect.any(Object),
      });

      expect(result.file_ids).toHaveLength(2);
    });

    it('should create a reasoning message with completed status', () => {
      const files: CreateDashboardsFile[] = [
        { name: 'Dashboard 1', yml_content: 'content1', status: 'completed', id: 'file-1' },
        { name: 'Dashboard 2', yml_content: 'content2', status: 'completed', id: 'file-2' },
      ];

      const result = createDashboardsReasoningMessage('tool-123', files, 'completed');

      expect(result).toMatchObject({
        id: 'tool-123',
        type: 'files',
        title: 'Created 2 dashboards',
        status: 'completed',
      });
    });

    it('should handle mixed success and failure', () => {
      const files: CreateDashboardsFile[] = [
        { name: 'Dashboard 1', yml_content: 'content1', status: 'completed', id: 'file-1' },
        { name: 'Dashboard 2', yml_content: 'content2', status: 'failed', error: 'Invalid YAML' },
      ];

      const result = createDashboardsReasoningMessage('tool-123', files, 'completed');

      expect(result).toMatchObject({
        id: 'tool-123',
        type: 'files',
        title: 'Created 1 dashboard, 1 failed',
        status: 'completed',
      });
    });

    it('should handle singular dashboard count', () => {
      const files: CreateDashboardsFile[] = [
        { name: 'Dashboard 1', yml_content: 'content1', status: 'completed', id: 'file-1' },
      ];

      const result = createDashboardsReasoningMessage('tool-123', files, 'completed');

      expect(result.title).toBe('Created 1 dashboard');
    });

    it('should include error information in file entries', () => {
      const files: CreateDashboardsFile[] = [
        { name: 'Dashboard 1', yml_content: 'content1', status: 'failed', error: 'Test error' },
      ];

      const result = createDashboardsReasoningMessage('tool-123', files, 'failed');

      const [firstId] = result.file_ids;
      expect(firstId).toBeDefined();
      if (firstId === undefined) throw new Error('Expected file id');
      expect(result.files[firstId]).toMatchObject({
        file_type: 'dashboard',
        file_name: 'Dashboard 1',
        status: 'failed',
        error: 'Test error',
      });
    });
  });

  describe('createDashboardsResponseMessage', () => {
    it('should create a response message', () => {
      const result = createDashboardsResponseMessage('tool-123', 'Test message');

      expect(result).toEqual({
        id: 'tool-123',
        type: 'text',
        message: 'Test message',
        is_final_message: false,
      });
    });
  });

  describe('createDashboardsRawLlmMessageEntry', () => {
    it('should create a raw LLM message entry with args', () => {
      const args = {
        files: [{ name: 'Dashboard 1', yml_content: 'content1' }],
      };

      const result = createDashboardsRawLlmMessageEntry('tool-123', 'create-dashboards', args);

      expect(result).toEqual({
        type: 'tool-call',
        toolCallId: 'tool-123',
        toolName: 'create-dashboards',
        args,
      });
    });

    it('should handle undefined args', () => {
      const result = createDashboardsRawLlmMessageEntry('tool-123', 'create-dashboards', undefined);

      expect(result).toEqual({
        type: 'tool-call',
        toolCallId: 'tool-123',
        toolName: 'create-dashboards',
        args: {},
      });
    });
  });

  describe('updateDashboardsProgressMessage', () => {
    it('should show starting message when no dashboards processed', () => {
      const files: CreateDashboardsFile[] = [{ name: 'Dashboard 1', yml_content: '' }];

      const result = updateDashboardsProgressMessage(files);
      expect(result).toBe('Starting dashboard creation...');
    });

    it('should show progress when partially processed', () => {
      const files: CreateDashboardsFile[] = [
        { name: 'Dashboard 1', yml_content: 'content1' },
        { name: 'Dashboard 2', yml_content: '' },
        { name: 'Dashboard 3', yml_content: '' },
      ];

      const result = updateDashboardsProgressMessage(files);
      expect(result).toBe('Processing dashboards... (1/3)');
    });

    it('should show completion message when all processed', () => {
      const files: CreateDashboardsFile[] = [
        { name: 'Dashboard 1', yml_content: 'content1' },
        { name: 'Dashboard 2', yml_content: 'content2' },
      ];

      const result = updateDashboardsProgressMessage(files);
      expect(result).toBe('Processed 2 dashboards');
    });

    it('should handle singular dashboard', () => {
      const files: CreateDashboardsFile[] = [{ name: 'Dashboard 1', yml_content: 'content1' }];

      const result = updateDashboardsProgressMessage(files);
      expect(result).toBe('Processed 1 dashboard');
    });
  });

  describe('extractDashboardsFileInfo', () => {
    it('should extract successful and failed files', () => {
      const files: CreateDashboardsFile[] = [
        {
          name: 'Dashboard 1',
          yml_content: 'content1',
          status: 'completed',
          id: 'file-1',
          version: 1,
        },
        { name: 'Dashboard 2', yml_content: 'content2', status: 'failed', error: 'Error message' },
        {
          name: 'Dashboard 3',
          yml_content: 'content3',
          status: 'completed',
          id: 'file-3',
          version: 2,
        },
      ];

      const result = extractDashboardsFileInfo(files);

      expect(result.successfulFiles).toHaveLength(2);
      expect(result.successfulFiles).toEqual([
        { id: 'file-1', name: 'Dashboard 1', version: 1 },
        { id: 'file-3', name: 'Dashboard 3', version: 2 },
      ]);

      expect(result.failedFiles).toHaveLength(1);
      expect(result.failedFiles).toEqual([{ name: 'Dashboard 2', error: 'Error message' }]);
    });

    it('should handle missing error messages', () => {
      const files: CreateDashboardsFile[] = [
        { name: 'Dashboard 1', yml_content: 'content1', status: 'failed' },
      ];

      const result = extractDashboardsFileInfo(files);

      expect(result.failedFiles).toEqual([{ name: 'Dashboard 1', error: 'Unknown error' }]);
    });

    it('should use default version if not provided', () => {
      const files: CreateDashboardsFile[] = [
        { name: 'Dashboard 1', yml_content: 'content1', status: 'completed', id: 'file-1' },
      ];

      const result = extractDashboardsFileInfo(files);

      expect(result.successfulFiles).toEqual([{ id: 'file-1', name: 'Dashboard 1', version: 1 }]);
    });
  });

  describe('TOOL_KEYS', () => {
    it('should have correct key mappings', () => {
      expect(TOOL_KEYS).toEqual({
        files: 'files',
        name: 'name',
        yml_content: 'yml_content',
      });
    });
  });
});
