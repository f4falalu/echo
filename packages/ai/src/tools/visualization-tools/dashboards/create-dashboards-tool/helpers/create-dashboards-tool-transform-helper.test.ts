import { describe, expect, it } from 'vitest';
import type { CreateDashboardStateFile, CreateDashboardsState } from '../create-dashboards-tool';
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

    it('should skip files without file_name property', () => {
      const state: CreateDashboardsState = {
        files: [
          {
            id: 'file-1',
            file_type: 'dashboard',
            version_number: 1,
            status: 'loading',
            // No file_name, so should be skipped
          },
          {
            id: 'file-2',
            file_name: 'Dashboard 2',
            file_type: 'dashboard',
            version_number: 1,
            file: { text: 'content2' },
            status: 'loading',
          },
        ] as CreateDashboardStateFile[],
      };

      const result = createCreateDashboardsReasoningEntry(state, 'tool-123');

      expect(result).toMatchObject({
        id: 'tool-123',
        type: 'files',
        title: 'Creating dashboards...',
        status: 'loading',
        file_ids: ['file-2'],
        files: expect.any(Object),
      });

      expect(result?.type).toBe('files');
      if (result?.type === 'files') {
        expect(result.file_ids).toHaveLength(1);
      }
    });

    it('should create a reasoning entry with proper file structure', () => {
      const state: CreateDashboardsState = {
        files: [
          {
            id: 'file-1',
            file_name: 'Dashboard 1',
            file_type: 'dashboard',
            version_number: 1,
            file: { text: 'content1' },
            status: 'completed',
          },
          {
            id: 'file-2',
            file_name: 'Dashboard 2',
            file_type: 'dashboard',
            version_number: 1,
            file: { text: 'content2' },
            status: 'completed',
          },
        ] as CreateDashboardStateFile[],
      };

      const result = createCreateDashboardsReasoningEntry(state, 'tool-123');

      expect(result).toMatchObject({
        id: 'tool-123',
        type: 'files',
        title: 'Creating dashboards...',
        status: 'loading',
        file_ids: ['file-1', 'file-2'],
      });

      // Verify files are properly structured
      if (result?.type === 'files') {
        expect(result.files['file-1']).toMatchObject({
          id: 'file-1',
          file_type: 'dashboard',
          file_name: 'Dashboard 1',
          version_number: 1,
          status: 'completed',
          file: { text: 'content1' },
        });
      }
    });

    it('should update toolCallId in state', () => {
      const state: CreateDashboardsState = {
        files: [
          {
            id: 'file-1',
            file_name: 'Dashboard 1',
            file_type: 'dashboard',
            version_number: 1,
            file: { text: 'content1' },
            status: 'loading',
          },
        ] as CreateDashboardStateFile[],
      };

      const result = createCreateDashboardsReasoningEntry(state, 'tool-123');

      expect(state.toolCallId).toBe('tool-123');
      expect(result).toBeDefined();
    });

    it('should handle incremental updates from streaming', () => {
      const state: CreateDashboardsState = {
        argsText: '{"files":[{"name":"Dashboard 1","yml_content":"partial',
      };

      // Simulate first update with partial data
      state.files = [
        {
          id: 'file-1',
          file_type: 'dashboard',
          version_number: 1,
          status: 'loading',
          // No file_name yet
        },
      ] as CreateDashboardStateFile[];

      let result = createCreateDashboardsReasoningEntry(state, 'tool-123');
      expect(result).toBeUndefined(); // Should be undefined without file_name

      // Simulate second update with more data
      state.files = [
        {
          id: 'file-1',
          file_name: 'Dashboard 1',
          file_type: 'dashboard',
          version_number: 1,
          status: 'loading',
          // Now has file_name but no file content yet
        },
      ] as CreateDashboardStateFile[];

      result = createCreateDashboardsReasoningEntry(state, 'tool-123');
      expect(result).toBeDefined();
      if (result?.type === 'files') {
        expect(result.file_ids).toEqual(['file-1']);
      }

      // Simulate third update with complete data
      state.files = [
        {
          id: 'file-1',
          file_name: 'Dashboard 1',
          file_type: 'dashboard',
          version_number: 1,
          file: { text: 'complete content' },
          status: 'loading',
        },
      ] as CreateDashboardStateFile[];

      result = createCreateDashboardsReasoningEntry(state, 'tool-123');
      if (result?.type === 'files') {
        expect(result.files['file-1']?.file?.text).toBe('complete content');
      }
    });

    it('should handle multiple files with incremental data', () => {
      const state: CreateDashboardsState = {
        files: [
          {
            id: 'file-1',
            file_name: 'Dashboard 1',
            file_type: 'dashboard',
            version_number: 1,
            file: { text: 'content1' },
            status: 'loading',
          },
          {
            id: 'file-2',
            // This one doesn't have file_name yet, should be skipped
            file_type: 'dashboard',
            version_number: 1,
            status: 'loading',
          },
          {
            id: 'file-3',
            file_name: 'Dashboard 3',
            file_type: 'dashboard',
            version_number: 1,
            // This one has name but no content yet
            status: 'loading',
          },
        ] as CreateDashboardStateFile[],
      };

      const result = createCreateDashboardsReasoningEntry(state, 'tool-123');

      // Should only include files with file_name
      if (result?.type === 'files') {
        expect(result.file_ids).toEqual(['file-1', 'file-3']);
        expect(result.files['file-1']?.file?.text).toBe('content1');
        expect(result.files['file-3']?.file?.text).toBe('');
      }
    });

    it('should handle empty files array after filtering', () => {
      const state: CreateDashboardsState = {
        files: [
          {
            id: 'file-1',
            // No file_name
            file_type: 'dashboard',
            version_number: 1,
            status: 'loading',
          },
          {
            id: 'file-2',
            // No file_name either
            file_type: 'dashboard',
            version_number: 1,
            status: 'loading',
          },
        ] as CreateDashboardStateFile[],
      };

      const result = createCreateDashboardsReasoningEntry(state, 'tool-123');

      // Should return undefined when no files have file_name
      expect(result).toBeUndefined();
    });
  });

  describe('createCreateDashboardsRawLlmMessageEntry', () => {
    it('should return undefined when no files in state', () => {
      const state: CreateDashboardsState = {};
      const result = createCreateDashboardsRawLlmMessageEntry(state, 'tool-123');
      expect(result).toBeUndefined();
    });

    it('should return undefined when files array is empty', () => {
      const state: CreateDashboardsState = {
        files: [],
      };
      const result = createCreateDashboardsRawLlmMessageEntry(state, 'tool-123');
      expect(result).toBeUndefined();
    });

    it('should create a raw LLM message entry from files', () => {
      const state: CreateDashboardsState = {
        files: [
          {
            id: 'file-1',
            file_name: 'Dashboard 1',
            file_type: 'dashboard',
            version_number: 1,
            file: { text: 'content1' },
            status: 'loading',
          },
          {
            id: 'file-2',
            file_name: 'Dashboard 2',
            file_type: 'dashboard',
            version_number: 1,
            file: { text: 'content2' },
            status: 'loading',
          },
        ] as CreateDashboardStateFile[],
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

    it('should filter out files without name or content', () => {
      const state: CreateDashboardsState = {
        files: [
          {
            id: 'file-1',
            file_name: 'Dashboard 1',
            file_type: 'dashboard',
            version_number: 1,
            file: { text: 'content1' },
            status: 'loading',
          },
          {
            id: 'file-2',
            // Missing file_name
            file_type: 'dashboard',
            version_number: 1,
            file: { text: 'content2' },
            status: 'loading',
          },
          {
            id: 'file-3',
            file_name: 'Dashboard 3',
            file_type: 'dashboard',
            version_number: 1,
            // Missing file content
            status: 'loading',
          },
        ] as CreateDashboardStateFile[],
      };

      const result = createCreateDashboardsRawLlmMessageEntry(state, 'tool-123');

      expect(result?.content[0]).toMatchObject({
        type: 'tool-call',
        input: {
          files: [
            { name: 'Dashboard 1', yml_content: 'content1' },
            // Only the first file should be included
          ],
        },
      });
    });

    it('should handle incremental state updates', () => {
      const state: CreateDashboardsState = {};

      // Start with no files
      let result = createCreateDashboardsRawLlmMessageEntry(state, 'tool-123');
      expect(result).toBeUndefined();

      // Add partial file
      state.files = [
        {
          id: 'file-1',
          file_type: 'dashboard',
          version_number: 1,
          status: 'loading',
        },
      ] as CreateDashboardStateFile[];

      result = createCreateDashboardsRawLlmMessageEntry(state, 'tool-123');
      // Returns a message with empty files array when no valid data
      expect(result).toBeDefined();
      expect(result?.content[0]).toMatchObject({
        type: 'tool-call',
        input: {
          files: [], // Empty array when filtered
        },
      });

      // Add file_name
      state.files[0]!.file_name = 'Dashboard 1';
      result = createCreateDashboardsRawLlmMessageEntry(state, 'tool-123');
      // Still empty array without content
      expect(result?.content[0]).toMatchObject({
        type: 'tool-call',
        input: {
          files: [],
        },
      });

      // Add file content
      state.files[0]!.file = { text: 'content1' };
      result = createCreateDashboardsRawLlmMessageEntry(state, 'tool-123');
      expect(result).toBeDefined();
      expect(result?.content[0]).toMatchObject({
        type: 'tool-call',
        input: {
          files: [{ name: 'Dashboard 1', yml_content: 'content1' }],
        },
      });
    });
  });
});
