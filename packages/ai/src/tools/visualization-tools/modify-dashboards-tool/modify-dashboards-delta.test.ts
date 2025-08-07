import { updateMessageFields } from '@buster/database';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createModifyDashboardsDelta } from './modify-dashboards-delta';
import type { ModifyDashboardsAgentContext, ModifyDashboardsState } from './modify-dashboards-tool';

vi.mock('@buster/database', () => ({
  updateMessageFields: vi.fn(),
}));

describe('modify-dashboards-delta', () => {
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

  it('should update database when messageId and reasoningEntryId exist', async () => {
    const contextWithMessageId = {
      ...mockContext,
      messageId: 'msg-123',
    };

    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
      messageId: 'msg-123',
      reasoningEntryId: 'reasoning-123',
      toolCallId: 'tool-123',
    };

    const onInputDelta = createModifyDashboardsDelta(contextWithMessageId, state);

    await onInputDelta('{"files":[{"id":"dash-1","yml_content":"content1"}]}');

    expect(updateMessageFields).toHaveBeenCalledWith(
      'msg-123',
      expect.objectContaining({
        reasoning: expect.arrayContaining([
          expect.objectContaining({
            id: 'tool-123',
            type: 'files',
            status: 'loading',
          }),
        ]),
      })
    );
  });

  it('should not update database when messageId is missing', async () => {
    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
      reasoningEntryId: 'reasoning-123',
    };

    const onInputDelta = createModifyDashboardsDelta(mockContext, state);

    await onInputDelta('{"files":[{"id":"dash-1","yml_content":"content1"}]}');

    expect(updateMessageFields).not.toHaveBeenCalled();
  });

  it('should not update database when reasoningEntryId is missing', async () => {
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

    expect(updateMessageFields).not.toHaveBeenCalled();
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
      reasoningEntryId: 'reasoning-123',
      toolCallId: 'tool-123',
    };

    vi.mocked(updateMessageFields).mockRejectedValueOnce(new Error('DB Error'));

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

  it('should filter out undefined entries when updating database', async () => {
    const contextWithMessageId = {
      ...mockContext,
      messageId: 'msg-123',
    };

    const state: ModifyDashboardsState = {
      argsText: '',
      files: [
        undefined as any,
        { id: 'dash-1', yml_content: 'content1', status: 'processing' },
        undefined as any,
      ],
      messageId: 'msg-123',
      reasoningEntryId: 'reasoning-123',
      toolCallId: 'tool-123',
    };

    const onInputDelta = createModifyDashboardsDelta(contextWithMessageId, state);
    await onInputDelta('{"files":[]}');

    expect(updateMessageFields).toHaveBeenCalledWith(
      'msg-123',
      expect.objectContaining({
        reasoning: expect.arrayContaining([
          expect.objectContaining({
            file_ids: ['dash-1'],
          }),
        ]),
      })
    );
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
});
