import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createModifyDashboardsDelta } from './modify-dashboards-delta';
import type { ModifyDashboardsContext, ModifyDashboardsState } from './modify-dashboards-tool';

vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn(),
}));

describe('modify-dashboards-delta', () => {
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

  it('should handle string deltas and accumulate text', async () => {
    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
    };

    const onInputDelta = createModifyDashboardsDelta(mockContext, state);

    await onInputDelta({ inputTextDelta: '{"files":[', ...mockOptions });
    expect(state.argsText).toBe('{"files":[');

    await onInputDelta({ inputTextDelta: '{"id":"dash-1",', ...mockOptions });
    expect(state.argsText).toBe('{"files":[{"id":"dash-1",');
  });

  it('should parse partial JSON and extract files', async () => {
    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
    };

    const onInputDelta = createModifyDashboardsDelta(mockContext, state);

    // Stream in a complete file object
    await onInputDelta({
      inputTextDelta: '{"files":[{"id":"dash-1","yml_content":"content1"}',
      ...mockOptions,
    });

    expect(state.files).toHaveLength(1);
    expect(state.files?.[0]).toMatchObject({
      id: 'dash-1',
      file_type: 'dashboard',
      version_number: 1,
      status: 'loading',
    });
    expect(state.files?.[0]?.file?.text).toBe('content1');
  });

  it('should update existing files when streaming', async () => {
    const state: ModifyDashboardsState = {
      argsText: '',
      files: [
        {
          id: 'dash-1',
          file_name: 'Dashboard 1',
          file_type: 'dashboard',
          version_number: 1,
          status: 'loading',
        },
      ],
    };

    const onInputDelta = createModifyDashboardsDelta(mockContext, state);

    await onInputDelta({
      inputTextDelta: '{"files":[{"id":"dash-1","yml_content":"updated content"}',
      ...mockOptions,
    });

    expect(state.files?.[0]?.file?.text).toBe('updated content');
    expect(state.files?.[0]?.file_name).toBe('Dashboard 1'); // Preserved from existing
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

    const onInputDelta = createModifyDashboardsDelta(contextWithMessageId, state);

    await onInputDelta({
      inputTextDelta: '{"files":[{"id":"dash-1","yml_content":"content1"}]}',
      ...mockOptions,
    });

    expect(updateMessageEntries).toHaveBeenCalled();
    const callArgs = vi.mocked(updateMessageEntries).mock.calls[0]?.[0];
    expect(callArgs?.messageId).toBe('msg-123');
    expect(callArgs?.mode).toBe('update');
  });

  it('should not update database when messageId is missing', async () => {
    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
      toolCallId: 'tool-123',
    };

    const onInputDelta = createModifyDashboardsDelta(mockContext, state);

    await onInputDelta({
      inputTextDelta: '{"files":[{"id":"dash-1","yml_content":"content1"}]}',
      ...mockOptions,
    });

    expect(updateMessageEntries).not.toHaveBeenCalled();
  });

  it('should not update database when no files parsed yet', async () => {
    const contextWithMessageId = {
      ...mockContext,
      messageId: 'msg-123',
    };

    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
      toolCallId: 'tool-123',
    };

    const onInputDelta = createModifyDashboardsDelta(contextWithMessageId, state);

    // Send partial JSON that doesn't have complete files yet
    await onInputDelta({
      inputTextDelta: '{"files":[',
      ...mockOptions,
    });

    // Should not update because no files were extracted yet
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

    const onInputDelta = createModifyDashboardsDelta(contextWithMessageId, state);
    await onInputDelta({
      inputTextDelta: '{"files":[{"id":"dash-1","yml_content":"content1"}]}',
      ...mockOptions,
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      '[modify-dashboards] Error updating entries during delta:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should handle placeholder files with just id', async () => {
    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
    };

    const onInputDelta = createModifyDashboardsDelta(mockContext, state);

    await onInputDelta({
      inputTextDelta: '{"files":[{"id":"dash-1"}',
      ...mockOptions,
    });

    expect(state.files).toHaveLength(1);
    expect(state.files?.[0]).toMatchObject({
      id: 'dash-1',
      file_type: 'dashboard',
      version_number: 1,
      status: 'loading',
    });
    expect(state.files?.[0]?.file).toBeUndefined();
  });

  it('should preserve existing file metadata', async () => {
    const state: ModifyDashboardsState = {
      argsText: '',
      files: [
        {
          id: 'dash-1',
          file_name: 'My Dashboard',
          file_type: 'dashboard',
          version_number: 3,
          status: 'loading',
        },
      ],
    };

    const onInputDelta = createModifyDashboardsDelta(mockContext, state);

    await onInputDelta({
      inputTextDelta: '{"files":[{"id":"dash-1","yml_content":"new content"}',
      ...mockOptions,
    });

    expect(state.files?.[0]).toMatchObject({
      id: 'dash-1',
      file_name: 'My Dashboard', // Preserved
      file_type: 'dashboard',
      version_number: 3, // Preserved
      status: 'loading',
    });
    expect(state.files?.[0]?.file?.text).toBe('new content');
  });

  it('should handle multiple files in stream', async () => {
    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
    };

    const onInputDelta = createModifyDashboardsDelta(mockContext, state);

    await onInputDelta({
      inputTextDelta:
        '{"files":[{"id":"dash-1","yml_content":"content1"},{"id":"dash-2","yml_content":"content2"}',
      ...mockOptions,
    });

    expect(state.files).toHaveLength(2);
    expect(state.files?.[0]?.id).toBe('dash-1');
    expect(state.files?.[1]?.id).toBe('dash-2');
    expect(state.files?.[0]?.file?.text).toBe('content1');
    expect(state.files?.[1]?.file?.text).toBe('content2');
  });
});