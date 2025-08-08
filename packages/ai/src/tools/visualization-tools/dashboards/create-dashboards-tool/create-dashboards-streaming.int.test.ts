import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCreateDashboardsTool } from './create-dashboards-tool';
import type { CreateDashboardsAgentContext, CreateDashboardsInput } from './create-dashboards-tool';

vi.mock('@buster/database', () => ({
  insertMessageReasoning: vi.fn(),
  updateMessageReasoning: vi.fn(),
}));

vi.mock('../create-dashboards-file-tool', () => ({
  createDashboards: {
    execute: vi.fn(),
  },
}));

describe('create-dashboards-tool streaming integration', () => {
  let context: CreateDashboardsAgentContext;
  let insertMessageReasoning: ReturnType<typeof vi.fn>;
  let updateMessageReasoning: ReturnType<typeof vi.fn>;
  let mockExecute: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const database = await import('@buster/database');
    insertMessageReasoning = vi.mocked(database.insertMessageReasoning);
    updateMessageReasoning = vi.mocked(database.updateMessageReasoning);

    const fileTool = await import('./create-dashboards-file-tool');
    mockExecute = vi.mocked(fileTool.createDashboards.execute);

    context = {
      userId: 'user-1',
      chatId: 'chat-1',
      dataSourceId: 'ds-1',
      dataSourceSyntax: 'postgresql',
      organizationId: 'org-1',
      messageId: 'msg-1',
    };
  });

  describe('full streaming workflow', () => {
    it('should handle complete streaming flow with database updates', async () => {
      insertMessageReasoning.mockResolvedValue({ id: 'reasoning-1' });
      mockExecute.mockResolvedValue({
        message: 'Successfully created 1 dashboard',
        duration: 100,
        files: [
          {
            id: 'dashboard-1',
            name: 'Test Dashboard',
            file_type: 'dashboard',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            version_number: 1,
          },
        ],
        failed_files: [],
      });

      const tool = createCreateDashboardsTool(context);
      const input: CreateDashboardsInput = {
        files: [{ name: 'Test Dashboard', yml_content: 'name: Test Dashboard\nrows: []' }],
      };

      // Simulate streaming callbacks
      if (tool.onInputStart) {
        await tool.onInputStart(input);
      }

      if (tool.onInputDelta) {
        // Simulate string deltas
        await tool.onInputDelta('{"files":[');
        await tool.onInputDelta('{"name":"Test Dashboard",');
        await tool.onInputDelta('"yml_content":"name: Test Dashboard\\nrows: []"}]}');
      }

      if (tool.onInputAvailable) {
        await tool.onInputAvailable(input);
      }

      // Execute the tool
      const result = await tool.execute(input);

      // Verify initial reasoning entry was created
      expect(insertMessageReasoning).toHaveBeenCalledWith(
        'msg-1',
        expect.objectContaining({
          type: 'files',
          title: 'Building new dashboards...',
          status: 'loading',
        })
      );

      // Verify reasoning entry was updated during streaming
      expect(updateMessageReasoning).toHaveBeenCalled();

      // Verify execution result
      expect(result).toEqual({
        message: 'Successfully created 1 dashboard',
        duration: 100,
        files: expect.arrayContaining([
          expect.objectContaining({
            id: 'dashboard-1',
            name: 'Test Dashboard',
          }),
        ]),
        failed_files: [],
      });
    });

    it('should handle streaming without messageId', async () => {
      const contextWithoutMessageId = { ...context, messageId: undefined };

      mockExecute.mockResolvedValue({
        message: 'Successfully created 1 dashboard',
        duration: 100,
        files: [
          {
            id: 'dashboard-1',
            name: 'Test Dashboard',
            file_type: 'dashboard',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            version_number: 1,
          },
        ],
        failed_files: [],
      });

      const tool = createCreateDashboardsTool(contextWithoutMessageId);
      const input: CreateDashboardsInput = {
        files: [{ name: 'Test Dashboard', yml_content: 'name: Test Dashboard\nrows: []' }],
      };

      // Simulate streaming callbacks
      if (tool.onInputStart) {
        await tool.onInputStart(input);
      }

      if (tool.onInputAvailable) {
        await tool.onInputAvailable(input);
      }

      const result = await tool.execute(input);

      // Should not create or update database entries
      expect(insertMessageReasoning).not.toHaveBeenCalled();
      expect(updateMessageReasoning).not.toHaveBeenCalled();

      // But should still execute successfully
      expect(result.files).toHaveLength(1);
    });

    it('should handle partial failures', async () => {
      insertMessageReasoning.mockResolvedValue({ id: 'reasoning-1' });
      mockExecute.mockResolvedValue({
        message: 'Partially created dashboards',
        duration: 100,
        files: [
          {
            id: 'dashboard-1',
            name: 'Dashboard 1',
            file_type: 'dashboard',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            version_number: 1,
          },
        ],
        failed_files: [
          {
            name: 'Dashboard 2',
            error: 'Invalid YAML',
          },
        ],
      });

      const tool = createCreateDashboardsTool(context);
      const input: CreateDashboardsInput = {
        files: [
          { name: 'Dashboard 1', yml_content: 'name: Dashboard 1\nrows: []' },
          { name: 'Dashboard 2', yml_content: 'invalid yaml' },
        ],
      };

      if (tool.onInputStart) {
        await tool.onInputStart(input);
      }

      if (tool.onInputAvailable) {
        await tool.onInputAvailable(input);
      }

      const result = await tool.execute(input);

      expect(result.files).toHaveLength(1);
      expect(result.failed_files).toHaveLength(1);
      expect(result.failed_files[0]).toEqual({
        name: 'Dashboard 2',
        error: 'Invalid YAML',
      });

      // Final reasoning update should reflect the failure
      expect(updateMessageReasoning).toHaveBeenLastCalledWith(
        'msg-1',
        'reasoning-1',
        expect.objectContaining({
          status: 'failed', // Because there were failed files
        })
      );
    });

    it('should handle complete failure', async () => {
      insertMessageReasoning.mockResolvedValue({ id: 'reasoning-1' });
      mockExecute.mockRejectedValue(new Error('Execution failed'));

      const tool = createCreateDashboardsTool(context);
      const input: CreateDashboardsInput = {
        files: [{ name: 'Dashboard 1', yml_content: 'name: Dashboard 1\nrows: []' }],
      };

      if (tool.onInputStart) {
        await tool.onInputStart(input);
      }

      await expect(tool.execute(input)).rejects.toThrow('Execution failed');

      // Should update reasoning entry with failure status
      expect(updateMessageReasoning).toHaveBeenLastCalledWith(
        'msg-1',
        'reasoning-1',
        expect.objectContaining({
          status: 'failed',
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      insertMessageReasoning.mockRejectedValue(new Error('Database error'));
      mockExecute.mockResolvedValue({
        message: 'Successfully created 1 dashboard',
        duration: 100,
        files: [
          {
            id: 'dashboard-1',
            name: 'Test Dashboard',
            file_type: 'dashboard',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            version_number: 1,
          },
        ],
        failed_files: [],
      });

      const tool = createCreateDashboardsTool(context);
      const input: CreateDashboardsInput = {
        files: [{ name: 'Test Dashboard', yml_content: 'name: Test Dashboard\nrows: []' }],
      };

      if (tool.onInputStart) {
        await tool.onInputStart(input);
      }

      // Should still execute successfully despite database error
      const result = await tool.execute(input);
      expect(result.files).toHaveLength(1);
    });
  });

  describe('object delta handling', () => {
    it('should handle object deltas during streaming', async () => {
      insertMessageReasoning.mockResolvedValue({ id: 'reasoning-1' });

      const tool = createCreateDashboardsTool(context);

      if (tool.onInputStart) {
        await tool.onInputStart({ files: [] });
      }

      if (tool.onInputDelta) {
        // Send object delta instead of string
        await tool.onInputDelta({
          files: [
            { name: 'Dashboard 1', yml_content: 'content1' },
            { name: 'Dashboard 2', yml_content: 'content2' },
          ],
        });
      }

      // Verify database was updated with the files
      expect(updateMessageReasoning).toHaveBeenCalledWith(
        'msg-1',
        'reasoning-1',
        expect.objectContaining({
          file_ids: expect.arrayContaining([expect.any(String), expect.any(String)]),
        })
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty input', async () => {
      mockExecute.mockResolvedValue({
        message: 'No dashboards to create',
        duration: 10,
        files: [],
        failed_files: [],
      });

      const tool = createCreateDashboardsTool(context);
      const input: CreateDashboardsInput = {
        files: [],
      };

      const result = await tool.execute(input);
      expect(result.files).toHaveLength(0);
      expect(result.failed_files).toHaveLength(0);
    });

    it('should handle very large input', async () => {
      const largeInput: CreateDashboardsInput = {
        files: Array.from({ length: 100 }, (_, i) => ({
          name: `Dashboard ${i + 1}`,
          yml_content: `name: Dashboard ${i + 1}\nrows: []`,
        })),
      };

      mockExecute.mockResolvedValue({
        message: 'Successfully created 100 dashboards',
        duration: 1000,
        files: largeInput.files.map((f, i) => ({
          id: `dashboard-${i + 1}`,
          name: f.name,
          file_type: 'dashboard',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          version_number: 1,
        })),
        failed_files: [],
      });

      const tool = createCreateDashboardsTool(context);
      const result = await tool.execute(largeInput);

      expect(result.files).toHaveLength(100);
    });
  });
});
