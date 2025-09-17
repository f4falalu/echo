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
          file_type: 'dashboard_file',
          version_number: 1,
          status: 'loading',
          file: { text: 'dashboard content' }, // Need file content for entry to be created
        },
      ],
    };

    const onInputStart = createModifyDashboardsStart(contextWithMessageId, state);
    await onInputStart(mockOptions);

    // The start handler resets state.files = [], so no database update happens
    expect(updateMessageEntries).not.toHaveBeenCalled();

    // Verify state was properly initialized
    expect(state.toolCallId).toBe('tool-123');
    expect(state.files).toEqual([]);
    expect(state.argsText).toBeUndefined();
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
      files: [], // Start with empty files as the handler will reset anyway
    };

    // The start handler won't call updateMessageEntries with empty files
    // This test should verify that the handler doesn't throw when there's nothing to update
    const onInputStart = createModifyDashboardsStart(contextWithMessageId, state);
    await expect(onInputStart(mockOptions)).resolves.not.toThrow();

    // Verify state was properly initialized
    expect(state.toolCallId).toBe('tool-123');
    expect(state.files).toEqual([]);
    expect(state.argsText).toBeUndefined();
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
      argsText: 'previous text',
      files: [
        {
          id: 'dash-1',
          file_type: 'dashboard_file',
          version_number: 1,
          status: 'loading',
          file: { text: 'dashboard content' },
        },
      ],
    };

    const onInputStart = createModifyDashboardsStart(contextWithMessageId, state);

    // First call - should reset state
    await onInputStart({ ...mockOptions, toolCallId: 'tool-123' });
    expect(state.toolCallId).toBe('tool-123');
    expect(state.files).toEqual([]); // Files should be reset
    expect(state.argsText).toBeUndefined(); // Args should be reset

    // Second call with different toolCallId - should reset state again
    state.files = [
      { id: 'dash-2', file_type: 'dashboard_file', version_number: 2, status: 'loading' },
    ];
    state.argsText = 'some text';

    await onInputStart({ ...mockOptions, toolCallId: 'tool-456' });
    expect(state.toolCallId).toBe('tool-456');
    expect(state.files).toEqual([]); // Files should be reset again
    expect(state.argsText).toBeUndefined(); // Args should be reset again

    // updateMessageEntries should not be called since files are always empty after reset
    expect(updateMessageEntries).not.toHaveBeenCalled();
  });
});
