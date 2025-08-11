import { describe, expect, it } from 'vitest';
import type { CreateDashboardsState } from '../create-dashboards-tool';
import {
  createCreateDashboardsRawLlmMessageEntry,
  createCreateDashboardsReasoningEntry,
} from './create-dashboards-tool-transform-helper';

describe('create-dashboards-tool-transform-helper', () => {
  describe('createCreateDashboardsReasoningEntry', () => {
    it('should return undefined when no files in state', () => {
      const state: CreateDashboardsState = {};
      const result = createCreateDashboardsReasoningEntry(state, 'tool-123');
      expect(result).toBeUndefined();
    });

    it('should return undefined when files array is empty', () => {
      const state: CreateDashboardsState = {
        files: [],
      };
      const result = createCreateDashboardsReasoningEntry(state, 'tool-123');
      expect(result).toBeUndefined();
    });

    it('should create a reasoning entry with processing status', () => {
      const state: CreateDashboardsState = {
        files: [
          { name: 'Dashboard 1', yml_content: 'content1', status: 'processing' },
          { name: 'Dashboard 2', yml_content: 'content2', status: 'processing' },
        ],
      };

      const result = createCreateDashboardsReasoningEntry(state, 'tool-123');

      expect(result).toMatchObject({
        id: 'tool-123',
        type: 'files',
        title: 'Creating 2 dashboards',
        status: 'loading',
        file_ids: expect.any(Array),
        files: expect.any(Object),
      });

      expect(result?.file_ids).toHaveLength(2);
    });

    it('should create a reasoning entry with completed status', () => {
      const state: CreateDashboardsState = {
        files: [
          { name: 'Dashboard 1', yml_content: 'content1', status: 'completed', id: 'file-1' },
          { name: 'Dashboard 2', yml_content: 'content2', status: 'completed', id: 'file-2' },
        ],
      };

      const result = createCreateDashboardsReasoningEntry(state, 'tool-123');

      expect(result).toMatchObject({
        id: 'tool-123',
        type: 'files',
        title: 'Created 2 dashboards',
        status: 'completed',
      });
    });

    it('should handle mixed success and failure', () => {
      const state: CreateDashboardsState = {
        files: [
          { name: 'Dashboard 1', yml_content: 'content1', status: 'completed', id: 'file-1' },
          { name: 'Dashboard 2', yml_content: 'content2', status: 'failed', error: 'Invalid YAML' },
        ],
      };

      const result = createCreateDashboardsReasoningEntry(state, 'tool-123');

      expect(result).toMatchObject({
        id: 'tool-123',
        type: 'files',
        title: 'Created 1 dashboard, 1 failed',
        status: 'failed',
      });
    });

    it('should handle all failed dashboards', () => {
      const state: CreateDashboardsState = {
        files: [
          { name: 'Dashboard 1', yml_content: 'content1', status: 'failed', error: 'Error 1' },
          { name: 'Dashboard 2', yml_content: 'content2', status: 'failed', error: 'Error 2' },
        ],
      };

      const result = createCreateDashboardsReasoningEntry(state, 'tool-123');

      expect(result).toMatchObject({
        id: 'tool-123',
        type: 'files',
        title: 'Failed to create dashboards',
        status: 'failed',
      });
    });

    it('should handle singular dashboard count', () => {
      const state: CreateDashboardsState = {
        files: [
          { name: 'Dashboard 1', yml_content: 'content1', status: 'completed', id: 'file-1' },
        ],
      };

      const result = createCreateDashboardsReasoningEntry(state, 'tool-123');

      expect(result?.title).toBe('Created 1 dashboard');
    });

    it('should include error information in file entries', () => {
      const state: CreateDashboardsState = {
        files: [
          { name: 'Dashboard 1', yml_content: 'content1', status: 'failed', error: 'Test error' },
        ],
      };

      const result = createCreateDashboardsReasoningEntry(state, 'tool-123');

      const fileIds = result?.file_ids;
      expect(fileIds).toBeDefined();
      if (!fileIds || !result) throw new Error('Expected result with file ids');
      
      const [firstId] = fileIds;
      expect(firstId).toBeDefined();
      expect(result.files[firstId]).toMatchObject({
        file_type: 'dashboard',
        file_name: 'Dashboard 1',
        status: 'failed',
        error: 'Test error',
      });
    });
  });

  describe('createCreateDashboardsRawLlmMessageEntry', () => {
    it('should return undefined when no parsedArgs in state', () => {
      const state: CreateDashboardsState = {};
      const result = createCreateDashboardsRawLlmMessageEntry(state, 'tool-123');
      expect(result).toBeUndefined();
    });

    it('should return undefined when parsedArgs has no files', () => {
      const state: CreateDashboardsState = {
        parsedArgs: {
          files: [],
        },
      };
      const result = createCreateDashboardsRawLlmMessageEntry(state, 'tool-123');
      expect(result).toBeUndefined();
    });

    it('should create a raw LLM message entry with parsedArgs', () => {
      const state: CreateDashboardsState = {
        parsedArgs: {
          files: [
            { name: 'Dashboard 1', yml_content: 'content1' },
            { name: 'Dashboard 2', yml_content: 'content2' },
          ],
        },
      };

      const result = createCreateDashboardsRawLlmMessageEntry(state, 'tool-123');

      expect(result).toEqual({
        role: 'assistant',
        content: [
          {
            type: 'tool-call',
            toolCallId: 'tool-123',
            toolName: 'createDashboards',
            input: {
              files: [
                { name: 'Dashboard 1', yml_content: 'content1' },
                { name: 'Dashboard 2', yml_content: 'content2' },
              ],
            },
          },
        ],
      });
    });
  });
});
