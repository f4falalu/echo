import { updateMessageFields } from '@buster/database';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createModifyDashboardsTool } from './modify-dashboards-tool';
import type { ModifyDashboardsAgentContext, ModifyDashboardsInput } from './modify-dashboards-tool';

vi.mock('@buster/database', () => ({
  updateMessageFields: vi.fn(),
}));

vi.mock('../modify-dashboards-file-tool', () => ({
  modifyDashboards: {
    execute: vi.fn().mockResolvedValue({
      message: 'Successfully modified 2 dashboards',
      duration: 1500,
      files: [
        {
          id: 'dash-1',
          name: 'Sales Dashboard',
          file_type: 'dashboard',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          version_number: 2,
        },
        {
          id: 'dash-2',
          name: 'Marketing Dashboard',
          file_type: 'dashboard',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          version_number: 3,
        },
      ],
      failed_files: [],
    }),
  },
}));

describe('modify-dashboards-tool streaming integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
  const mockContext: ModifyDashboardsAgentContext = {
    userId: 'user-123',
    chatId: 'chat-123',
    dataSourceId: 'ds-123',
    dataSourceSyntax: 'postgresql',
    organizationId: 'org-123',
    messageId: 'msg-123',
  };

  const mockInput: ModifyDashboardsInput = {
    files: [
      { id: 'dash-1', yml_content: 'name: Sales Dashboard\nrows:\n  - id: 1' },
      { id: 'dash-2', yml_content: 'name: Marketing Dashboard\nrows:\n  - id: 1' },
    ],
  };

  it('should handle complete streaming flow with database updates', async () => {
    const tool = createModifyDashboardsTool(mockContext);

    // Simulate streaming start
    if (tool.onInputStart) {
      await tool.onInputStart(mockInput);
    }

    // Verify initial database entry was created
    expect(updateMessageFields).toHaveBeenCalledWith(
      'msg-123',
      expect.objectContaining({
        rawLlmMessages: expect.arrayContaining([
          expect.objectContaining({
            type: 'tool-call',
            toolName: 'modify-dashboards-file',
          }),
        ]),
        reasoning: expect.arrayContaining([
          expect.objectContaining({
            type: 'files',
            title: 'Modifying dashboards...',
            status: 'loading',
          }),
        ]),
      })
    );

    // Simulate streaming deltas
    if (tool.onInputDelta) {
      await tool.onInputDelta('{"files":[');
      await tool.onInputDelta('{"id":"dash-1",');
      await tool.onInputDelta('"yml_content":"name: Sales Dashboard\\nrows:\\n  - id: 1"}');
      await tool.onInputDelta(',{"id":"dash-2",');
      await tool.onInputDelta('"yml_content":"name: Marketing Dashboard\\nrows:\\n  - id: 1"}');
      await tool.onInputDelta(']}');
    }

    // Simulate input available
    if (tool.onInputAvailable) {
      await tool.onInputAvailable(mockInput);
    }

    // Execute the tool
    const result = await tool.execute(mockInput);

    // Verify result
    expect(result).toMatchObject({
      message: 'Successfully modified 2 dashboards',
      files: expect.arrayContaining([
        expect.objectContaining({
          id: 'dash-1',
          name: 'Sales Dashboard',
        }),
        expect.objectContaining({
          id: 'dash-2',
          name: 'Marketing Dashboard',
        }),
      ]),
      failed_files: [],
    });

    // Verify final database update
    const finalCall = vi
      .mocked(updateMessageFields)
      .mock.calls.find((call) => call[1].reasoning?.[0]?.status === 'completed');

    expect(finalCall).toBeDefined();
    if (finalCall) {
      expect(finalCall[1].reasoning[0]).toMatchObject({
        type: 'files',
        title: 'Modified 2 dashboards',
        status: 'completed',
      });
    }
  });

  it('should handle streaming without messageId', async () => {
    const contextWithoutMessageId: ModifyDashboardsAgentContext = {
      ...mockContext,
      messageId: undefined,
    };

    const tool = createModifyDashboardsTool(contextWithoutMessageId);

    vi.mocked(updateMessageFields).mockClear();

    // Run through streaming flow
    if (tool.onInputStart) {
      await tool.onInputStart(mockInput);
    }

    if (tool.onInputDelta) {
      await tool.onInputDelta(mockInput);
    }

    if (tool.onInputAvailable) {
      await tool.onInputAvailable(mockInput);
    }

    const result = await tool.execute(mockInput);

    // Should not update database
    expect(updateMessageFields).not.toHaveBeenCalled();

    // Should still return result
    expect(result).toBeDefined();
    expect(result.files).toHaveLength(2);
  });

  it('should handle partial failures', async () => {
    vi.mocked(
      (await import('../modify-dashboards-file-tool')).modifyDashboards.execute
    ).mockResolvedValueOnce({
      message: 'Modified 1 dashboard, 1 failed',
      duration: 1500,
      files: [
        {
          id: 'dash-1',
          name: 'Sales Dashboard',
          file_type: 'dashboard',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          version_number: 2,
        },
      ],
      failed_files: [
        {
          file_name: 'Marketing Dashboard',
          error: 'Invalid YAML syntax',
        },
      ],
    });

    const tool = createModifyDashboardsTool(mockContext);

    const result = await tool.execute(mockInput);

    expect(result.files).toHaveLength(1);
    expect(result.failed_files).toHaveLength(1);
    expect(result.failed_files[0]).toMatchObject({
      file_name: 'Marketing Dashboard',
      error: 'Invalid YAML syntax',
    });
  });

  it('should handle streaming with malformed JSON gracefully', async () => {
    const tool = createModifyDashboardsTool(mockContext);

    if (tool.onInputStart) {
      await tool.onInputStart(mockInput);
    }

    // Send malformed JSON
    if (tool.onInputDelta) {
      await tool.onInputDelta('{"files":[{"id":"dash-1"');
      await tool.onInputDelta('malformed json here');
      await tool.onInputDelta(',"yml_content":"content1"}]}');
    }

    // Should still work when final valid input is provided
    if (tool.onInputAvailable) {
      await tool.onInputAvailable(mockInput);
    }

    const result = await tool.execute(mockInput);
    expect(result).toBeDefined();
  });

  it('should accumulate text correctly across multiple deltas', async () => {
    const tool = createModifyDashboardsTool(mockContext);

    // Access state through the closure (this is a bit hacky but works for testing)
    const state = (tool as any).state || {};

    if (tool.onInputDelta) {
      await tool.onInputDelta('{"fil');
      await tool.onInputDelta('es":[{"');
      await tool.onInputDelta('id":"d');
      await tool.onInputDelta('ash-1"');
    }

    // Check that text was accumulated correctly
    expect(state.argsText).toContain('{"files":[{"id":"dash-1"');
  });
});
