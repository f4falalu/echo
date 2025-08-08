import { updateMessageEntries } from '@buster/database';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createModifyDashboardsDelta } from './modify-dashboards-delta';
import type { ModifyDashboardsContext, ModifyDashboardsState } from './modify-dashboards-tool';

vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn(),
}));

vi.mock('braintrust', () => ({
  wrapTraced: (fn: unknown, _options?: unknown) => fn,
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

  it('should handle string deltas and accumulate text', async () => {
    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
    };

    const onInputDelta = createModifyDashboardsDelta(mockContext, state);

    await onInputDelta('{"files":[');
    expect(state.argsText).toBe('{"files":[');

    await onInputDelta('{"id":"dash-1",');
    expect(state.argsText).toBe('{"files":[{"id":"dash-1",');
  });

  it('should parse partial JSON and extract files', async () => {
    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
    };

    const onInputDelta = createModifyDashboardsDelta(mockContext, state);

    // Stream in a complete file object
    await onInputDelta('{"files":[{"id":"dash-1","yml_content":"content1"}');

    expect(state.files).toHaveLength(1);
    expect(state.files[0]).toMatchObject({
      id: 'dash-1',
      yml_content: 'content1',
      status: 'processing',
    });
  });

  it('should update existing files when streaming', async () => {
    const state: ModifyDashboardsState = {
      argsText: '',
      files: [{ id: 'dash-1', yml_content: '', status: 'processing' }],
    };

    const onInputDelta = createModifyDashboardsDelta(mockContext, state);

    await onInputDelta('{"files":[{"id":"dash-1","yml_content":"updated content"}');

    expect(state.files[0].yml_content).toBe('updated content');
  });

  it('should handle object deltas', async () => {
    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
    };

    const onInputDelta = createModifyDashboardsDelta(mockContext, state);

    await onInputDelta({
      files: [
        { id: 'dash-1', yml_content: 'content1' },
        { id: 'dash-2', yml_content: 'content2' },
      ],
    });

    expect(state.files).toHaveLength(2);
    expect(state.parsedArgs).toBeDefined();
    expect(state.parsedArgs?.files).toHaveLength(2);
  });

  it('should update database when messageId and toolCallId exist', async () => {
    const contextWithMessageId = {
      ...mockContext,
      messageId: 'msg-123',
    };

    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
      messageId: 'msg-123',
      toolCallId: 'tool-123',
    };

    const onInputDelta = createModifyDashboardsDelta(contextWithMessageId, state);

    await onInputDelta('{"files":[{"id":"dash-1","yml_content":"content1"}]}');

    expect(updateMessageEntries).toHaveBeenCalled();
    const callArgs = vi.mocked(updateMessageEntries).mock.calls[0][0];
    expect(callArgs.messageId).toBe('msg-123');
    expect(callArgs.mode).toBe('update');
    expect(callArgs.reasoningEntry.id).toBe('tool-123');
    expect(callArgs.reasoningEntry.type).toBe('files');
    expect(callArgs.reasoningEntry.status).toBe('loading');
    expect(callArgs.responseEntry.id).toBe('tool-123');
    expect(callArgs.responseEntry.type).toBe('text');
    expect(callArgs.rawLlmMessage.role).toBe('assistant');
  });

  it('should not update database when messageId is missing', async () => {
    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
      toolCallId: 'tool-123',
    };

    const onInputDelta = createModifyDashboardsDelta(mockContext, state);

    await onInputDelta('{"files":[{"id":"dash-1","yml_content":"content1"}]}');

    expect(updateMessageEntries).not.toHaveBeenCalled();
  });

  it('should not update database when toolCallId is missing', async () => {
    const contextWithMessageId = {
      ...mockContext,
      messageId: 'msg-123',
    };

    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
      messageId: 'msg-123',
    };

    const onInputDelta = createModifyDashboardsDelta(contextWithMessageId, state);

    await onInputDelta('{"files":[{"id":"dash-1","yml_content":"content1"}]}');

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
      messageId: 'msg-123',
      toolCallId: 'tool-123',
    };

    vi.mocked(updateMessageEntries).mockRejectedValueOnce(new Error('DB Error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const onInputDelta = createModifyDashboardsDelta(contextWithMessageId, state);
    await onInputDelta('{"files":[{"id":"dash-1","yml_content":"content1"}]}');

    expect(consoleSpy).toHaveBeenCalledWith(
      '[modify-dashboards] Failed to update streaming progress',
      expect.objectContaining({
        messageId: 'msg-123',
        error: 'DB Error',
      })
    );

    consoleSpy.mockRestore();
  });

  it('should handle placeholder files with just id', async () => {
    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
    };

    const onInputDelta = createModifyDashboardsDelta(mockContext, state);

    await onInputDelta('{"files":[{"id":"dash-1"}');

    expect(state.files).toHaveLength(1);
    expect(state.files[0]).toMatchObject({
      id: 'dash-1',
      yml_content: '',
      status: 'processing',
    });
  });

  it('should preserve existing files in state', async () => {
    const contextWithMessageId = {
      ...mockContext,
      messageId: 'msg-123',
    };

    const state: ModifyDashboardsState = {
      argsText: '',
      files: [{ id: 'dash-1', yml_content: 'content1', status: 'processing' }],
      messageId: 'msg-123',
      toolCallId: 'tool-123',
    };

    const onInputDelta = createModifyDashboardsDelta(contextWithMessageId, state);
    await onInputDelta('{"files":[]}');

    expect(updateMessageEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: 'msg-123',
        reasoningEntry: expect.objectContaining({
          file_ids: ['dash-1'],
        }),
      })
    );
  });
});
