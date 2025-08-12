import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createModifyDashboardsFinish } from './modify-dashboards-finish';
import type {
  ModifyDashboardsContext,
  ModifyDashboardsInput,
  ModifyDashboardsState,
} from './modify-dashboards-tool';

vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn(),
}));

describe('modify-dashboards-finish', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockContext: ModifyDashboardsContext = {
    userId: 'user-123',
    chatId: 'chat-123',
    dataSourceId: 'ds-123',
    dataSourceSyntax: 'postgresql',
    organizationId: 'org-123',
  };

  const mockInput: ModifyDashboardsInput = {
    files: [
      { id: 'dash-1', yml_content: 'content1' },
      { id: 'dash-2', yml_content: 'content2' },
    ],
  };

  const mockOptions: ToolCallOptions = {
    toolCallId: 'tool-123',
    messages: [],
  };

  it('should store files in state', async () => {
    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
    };

    const onInputAvailable = createModifyDashboardsFinish(mockContext, state);
    await onInputAvailable({ input: mockInput, ...mockOptions });

    expect(state.files).toHaveLength(2);
    expect(state.files?.[0]).toMatchObject({
      id: 'dash-1',
      file_type: 'dashboard',
      version_number: 1,
      file: { text: 'content1' },
      status: 'loading',
    });
    expect(state.files?.[1]).toMatchObject({
      id: 'dash-2',
      file_type: 'dashboard',
      version_number: 1,
      file: { text: 'content2' },
      status: 'loading',
    });
  });

  it('should preserve existing file metadata', async () => {
    const state: ModifyDashboardsState = {
      argsText: '',
      files: [
        {
          id: 'dash-1',
          file_name: 'Sales Dashboard',
          file_type: 'dashboard',
          version_number: 3,
          status: 'loading',
        },
        {
          id: 'dash-2',
          file_name: 'Marketing Dashboard',
          file_type: 'dashboard',
          version_number: 2,
          status: 'loading',
        },
      ],
    };

    const onInputAvailable = createModifyDashboardsFinish(mockContext, state);
    await onInputAvailable({ input: mockInput, ...mockOptions });

    expect(state.files?.[0]).toMatchObject({
      id: 'dash-1',
      file_name: 'Sales Dashboard', // Preserved
      file_type: 'dashboard',
      version_number: 3, // Preserved
      file: { text: 'content1' },
      status: 'loading',
    });
    expect(state.files?.[1]).toMatchObject({
      id: 'dash-2',
      file_name: 'Marketing Dashboard', // Preserved
      file_type: 'dashboard',
      version_number: 2, // Preserved
      file: { text: 'content2' },
      status: 'loading',
    });
  });

  it('should update database when messageId and toolCallId exist', async () => {
    const contextWithMessageId = {
      ...mockContext,
      messageId: 'msg-123',
    };

    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
      toolCallId: 'tool-123',
    };

    const onInputAvailable = createModifyDashboardsFinish(contextWithMessageId, state);
    await onInputAvailable({ input: mockInput, ...mockOptions });

    expect(updateMessageEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: 'msg-123',
        mode: 'update',
      })
    );
  });

  it('should not update database when messageId is missing', async () => {
    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
      toolCallId: 'tool-123',
    };

    const onInputAvailable = createModifyDashboardsFinish(mockContext, state);
    await onInputAvailable({ input: mockInput, ...mockOptions });

    expect(updateMessageEntries).not.toHaveBeenCalled();
  });

  it('should not update database when toolCallId is missing from state', async () => {
    const contextWithMessageId = {
      ...mockContext,
      messageId: 'msg-123',
    };

    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
      // No toolCallId in state
    };

    const onInputAvailable = createModifyDashboardsFinish(contextWithMessageId, state);
    await onInputAvailable({ input: mockInput, ...mockOptions });

    // Should not update because state.toolCallId is undefined
    expect(updateMessageEntries).not.toHaveBeenCalled();
  });

  it('should handle database update errors gracefully', async () => {
    const contextWithMessageId = {
      ...mockContext,
      messageId: 'msg-123',
    };

    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
      toolCallId: 'tool-123',
    };

    vi.mocked(updateMessageEntries).mockRejectedValueOnce(new Error('DB Error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const onInputAvailable = createModifyDashboardsFinish(contextWithMessageId, state);
    await onInputAvailable({ input: mockInput, ...mockOptions });

    expect(consoleSpy).toHaveBeenCalledWith(
      '[modify-dashboards] Error updating entries on finish:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should handle empty files', async () => {
    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
    };

    const emptyInput: ModifyDashboardsInput = {
      files: [],
    };

    const onInputAvailable = createModifyDashboardsFinish(mockContext, state);
    await onInputAvailable({ input: emptyInput, ...mockOptions });

    expect(state.files).toHaveLength(0);
  });

  it('should not update database when no files to update', async () => {
    const contextWithMessageId = {
      ...mockContext,
      messageId: 'msg-123',
    };

    const state: ModifyDashboardsState = {
      argsText: '',
      files: undefined,
      toolCallId: 'tool-123',
    };

    const emptyInput: ModifyDashboardsInput = {
      files: [],
    };

    const onInputAvailable = createModifyDashboardsFinish(contextWithMessageId, state);
    await onInputAvailable({ input: emptyInput, ...mockOptions });

    // Since files is empty, no reasoning or raw LLM entries will be created
    expect(updateMessageEntries).not.toHaveBeenCalled();
  });

  it('should handle undefined input files', async () => {
    const state: ModifyDashboardsState = {
      argsText: '',
      files: [
        {
          id: 'existing-1',
          file_type: 'dashboard',
          version_number: 1,
          status: 'loading',
        },
      ],
    };

    const inputWithoutFiles = {} as ModifyDashboardsInput;

    const onInputAvailable = createModifyDashboardsFinish(mockContext, state);
    await onInputAvailable({ input: inputWithoutFiles, ...mockOptions });

    // State should remain unchanged when input.files is undefined
    expect(state.files).toHaveLength(1);
    expect(state.files?.[0]?.id).toBe('existing-1');
  });
});