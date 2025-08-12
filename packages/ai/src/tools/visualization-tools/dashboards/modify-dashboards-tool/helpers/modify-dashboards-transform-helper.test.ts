import { describe, expect, it } from 'vitest';
import type { ModifyDashboardStateFile, ModifyDashboardsState } from '../modify-dashboards-tool';
import {
  createModifyDashboardsRawLlmMessageEntry,
  createModifyDashboardsReasoningEntry,
} from './modify-dashboards-transform-helper';

describe('modify-dashboards-transform-helper', () => {
  describe('createModifyDashboardsReasoningEntry', () => {
    it('should create reasoning message with loading status', () => {
      const state: ModifyDashboardsState = {
        toolCallId: 'tool-123',
        argsText: '',
        files: [
          {
            id: 'dash-1',
            file_name: 'Sales Dashboard',
            file_type: 'dashboard',
            version_number: 1,
            file: { text: 'content1' },
            status: 'loading',
          },
          {
            id: 'dash-2',
            file_name: 'Marketing Dashboard',
            file_type: 'dashboard',
            version_number: 1,
            file: { text: 'content2' },
            status: 'loading',
          },
        ],
      };

      const result = createModifyDashboardsReasoningEntry(state, 'tool-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('tool-123');
      expect(result?.type).toBe('files');
      expect(result?.title).toBe('Modifying dashboards...');
      expect(result?.status).toBe('loading');
      if (result?.type === 'files') {
        expect(result.file_ids).toEqual(['dash-1', 'dash-2']);
        expect(result.files['dash-1']).toMatchObject({
          id: 'dash-1',
          file_type: 'dashboard',
          file_name: 'Sales Dashboard',
          status: 'loading',
          file: { text: 'content1' },
        });
      }
    });

    it('should return undefined when no files', () => {
      const state: ModifyDashboardsState = {
        toolCallId: 'tool-123',
        argsText: '',
        files: [],
      };

      const result = createModifyDashboardsReasoningEntry(state, 'tool-123');

      expect(result).toBeUndefined();
    });

    it('should handle undefined files', () => {
      const state: ModifyDashboardsState = {
        toolCallId: 'tool-123',
        argsText: '',
      };

      const result = createModifyDashboardsReasoningEntry(state, 'tool-123');

      expect(result).toBeUndefined();
    });

    it('should skip files without id', () => {
      const state: ModifyDashboardsState = {
        toolCallId: 'tool-123',
        argsText: '',
        files: [
          {
            id: 'dash-1',
            file_name: 'Dashboard 1',
            file_type: 'dashboard',
            version_number: 1,
            file: { text: 'content1' },
            status: 'loading',
          },
          {
            id: '',
            file_name: 'Dashboard 2',
            file_type: 'dashboard',
            version_number: 1,
            file: { text: 'content2' },
            status: 'loading',
          } as ModifyDashboardStateFile,
        ],
      };

      const result = createModifyDashboardsReasoningEntry(state, 'tool-123');

      expect(result).toBeDefined();
      if (result?.type === 'files') {
        expect(result.file_ids).toEqual(['dash-1']);
        expect(result.files['dash-1']).toBeDefined();
        expect(result.files['']).toBeUndefined();
      }
    });

    it('should use default dashboard name when file_name is missing', () => {
      const state: ModifyDashboardsState = {
        toolCallId: 'tool-123',
        argsText: '',
        files: [
          {
            id: 'dash-1',
            file_type: 'dashboard',
            version_number: 1,
            file: { text: 'content1' },
            status: 'loading',
          },
        ],
      };

      const result = createModifyDashboardsReasoningEntry(state, 'tool-123');

      expect(result).toBeDefined();
      if (result?.type === 'files') {
        expect(result.files['dash-1']?.file_name).toBe('Dashboard dash-1');
      }
    });

    it('should include version number', () => {
      const state: ModifyDashboardsState = {
        toolCallId: 'tool-123',
        argsText: '',
        files: [
          {
            id: 'dash-1',
            file_name: 'Sales Dashboard',
            file_type: 'dashboard',
            version_number: 3,
            file: { text: 'content1' },
            status: 'completed',
          },
        ],
      };

      const result = createModifyDashboardsReasoningEntry(state, 'tool-123');

      expect(result).toBeDefined();
      if (result?.type === 'files') {
        expect(result.files['dash-1']?.version_number).toBe(3);
      }
    });
  });

  describe('createModifyDashboardsRawLlmMessageEntry', () => {
    it('should create raw LLM message entry', () => {
      const state: ModifyDashboardsState = {
        toolCallId: 'tool-123',
        argsText: '',
        files: [
          {
            id: 'dash-1',
            file_name: 'Dashboard 1',
            file_type: 'dashboard',
            version_number: 1,
            file: { text: 'content1' },
            status: 'loading',
          },
          {
            id: 'dash-2',
            file_name: 'Dashboard 2',
            file_type: 'dashboard',
            version_number: 1,
            file: { text: 'content2' },
            status: 'loading',
          },
        ],
      };

      const result = createModifyDashboardsRawLlmMessageEntry(state, 'tool-123');

      expect(result).toBeDefined();
      expect(result?.role).toBe('assistant');
      expect(result?.content).toHaveLength(1);
      const content = result?.content[0];
      expect(content).toMatchObject({
        type: 'tool-call',
        toolCallId: 'tool-123',
        toolName: 'modifyDashboards',
      });
      if (content && typeof content === 'object' && 'input' in content) {
        expect((content.input as any).files).toHaveLength(2);
        expect((content.input as any).files[0]).toEqual({
          id: 'dash-1',
          yml_content: 'content1',
        });
      }
    });

    it('should return undefined when no files', () => {
      const state: ModifyDashboardsState = {
        toolCallId: 'tool-123',
        argsText: '',
        files: [],
      };

      const result = createModifyDashboardsRawLlmMessageEntry(state, 'tool-123');

      expect(result).toBeUndefined();
    });

    it('should filter out files without content', () => {
      const state: ModifyDashboardsState = {
        toolCallId: 'tool-123',
        argsText: '',
        files: [
          {
            id: 'dash-1',
            file_name: 'Dashboard 1',
            file_type: 'dashboard',
            version_number: 1,
            file: { text: 'content1' },
            status: 'loading',
          },
          {
            id: 'dash-2',
            file_name: 'Dashboard 2',
            file_type: 'dashboard',
            version_number: 1,
            status: 'loading',
          },
          {
            id: 'dash-3',
            file_name: 'Dashboard 3',
            file_type: 'dashboard',
            version_number: 1,
            file: { text: '' },
            status: 'loading',
          },
        ],
      };

      const result = createModifyDashboardsRawLlmMessageEntry(state, 'tool-123');

      expect(result).toBeDefined();
      const content = result?.content[0];
      if (content && typeof content === 'object' && 'input' in content) {
        expect((content.input as any).files).toHaveLength(1);
        expect((content.input as any).files[0].id).toBe('dash-1');
      }
    });
  });
});
