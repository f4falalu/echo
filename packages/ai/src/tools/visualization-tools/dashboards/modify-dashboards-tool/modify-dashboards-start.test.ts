import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createModifyDashboardsStart } from './modify-dashboards-start';
import type { ModifyDashboardsContext, ModifyDashboardsState } from './modify-dashboards-tool';

vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn(),
}));

describe('modify-dashboards-start', () => {
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

  const mockOptions: ToolCallOptions = {
    toolCallId: 'tool-123',
    messages: [],
  };

  it('should set toolCallId in state', async () => {
    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
    };

    const onInputStart = createModifyDashboardsStart(mockContext, state);
    await onInputStart(mockOptions);

    expect(state.toolCallId).toBe('tool-123');
  });

  it('should create database entries when messageId exists', async () => {
    const contextWithMessageId = {
      ...mockContext,
      messageId: 'msg-123',
    };

    const state: ModifyDashboardsState = {
      argsText: '',
      files: [
        {
          id: 'dash-1',
          file_type: 'dashboard',
          version_number: 1,
          status: 'loading',
        },
      ],
    };

    const onInputStart = createModifyDashboardsStart(contextWithMessageId, state);
    await onInputStart(mockOptions);

    expect(updateMessageEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: 'msg-123',
        mode: 'append',
      })
    );
  });

  it('should not create database entries when messageId is missing', async () => {
    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
    };

    const onInputStart = createModifyDashboardsStart(mockContext, state);
    await onInputStart(mockOptions);

    expect(updateMessageEntries).not.toHaveBeenCalled();
  });

  it('should handle database update errors gracefully', async () => {
    const contextWithMessageId = {
      ...mockContext,
      messageId: 'msg-123',
    };

    const state: ModifyDashboardsState = {
      argsText: '',
      files: [
        {
          id: 'dash-1',
          file_type: 'dashboard',
          version_number: 1,
          status: 'loading',
        },
      ],
    };

    vi.mocked(updateMessageEntries).mockRejectedValueOnce(new Error('DB Error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const onInputStart = createModifyDashboardsStart(contextWithMessageId, state);
    await onInputStart(mockOptions);

    expect(consoleSpy).toHaveBeenCalledWith(
      '[modify-dashboards] Error updating entries on finish:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should not call updateMessageEntries when no entries to update', async () => {
    const contextWithMessageId = {
      ...mockContext,
      messageId: 'msg-123',
    };

    const state: ModifyDashboardsState = {
      argsText: '',
      files: undefined, // No files, so no entries will be created
    };

    const onInputStart = createModifyDashboardsStart(contextWithMessageId, state);
    await onInputStart(mockOptions);

    // Since there are no files, createModifyDashboardsReasoningEntry and
    // createModifyDashboardsRawLlmMessageEntry will return undefined,
    // so updateMessageEntries should not be called
    expect(updateMessageEntries).not.toHaveBeenCalled();
  });

  it('should handle multiple calls with different toolCallIds', async () => {
    const contextWithMessageId = {
      ...mockContext,
      messageId: 'msg-123',
    };

    const state: ModifyDashboardsState = {
      argsText: '',
      files: [
        {
          id: 'dash-1',
          file_type: 'dashboard',
          version_number: 1,
          status: 'loading',
        },
      ],
    };

    const onInputStart = createModifyDashboardsStart(contextWithMessageId, state);

    // First call
    await onInputStart({ ...mockOptions, toolCallId: 'tool-123' });
    expect(state.toolCallId).toBe('tool-123');

    // Second call with different toolCallId
    await onInputStart({ ...mockOptions, toolCallId: 'tool-456' });
    expect(state.toolCallId).toBe('tool-456');

    expect(updateMessageEntries).toHaveBeenCalledTimes(2);
  });
});
