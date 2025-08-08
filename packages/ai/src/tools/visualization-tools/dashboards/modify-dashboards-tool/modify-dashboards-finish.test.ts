import { updateMessageEntries } from '@buster/database';
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

vi.mock('braintrust', () => ({
  wrapTraced: (fn: unknown, _options?: unknown) => fn,
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

  it('should store complete input in state', async () => {
    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
    };

    const onInputAvailable = createModifyDashboardsFinish(mockContext, state);
    await onInputAvailable(mockInput);

    expect(state.parsedArgs).toEqual(mockInput);
    expect(state.files).toHaveLength(2);
    expect(state.files[0]).toMatchObject({
      id: 'dash-1',
      yml_content: 'content1',
      status: 'processing',
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
      messageId: 'msg-123',
      toolCallId: 'tool-123',
    };

    const onInputAvailable = createModifyDashboardsFinish(contextWithMessageId, state);
    await onInputAvailable(mockInput);

    expect(updateMessageEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: 'msg-123',
        reasoningEntry: expect.objectContaining({
          id: 'tool-123',
          type: 'files',
          status: 'loading',
          file_ids: ['dash-1', 'dash-2'],
        }),
        responseEntry: expect.objectContaining({
          id: 'tool-123',
          type: 'text',
          message: 'Processing dashboard modifications...',
        }),
        rawLlmMessage: expect.objectContaining({
          role: 'assistant',
          content: expect.arrayContaining([
            expect.objectContaining({
              type: 'tool-call',
              toolCallId: 'tool-123',
              toolName: 'modify-dashboards',
            }),
          ]),
        }),
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
    await onInputAvailable(mockInput);

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

    const onInputAvailable = createModifyDashboardsFinish(contextWithMessageId, state);
    await onInputAvailable(mockInput);

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

    const onInputAvailable = createModifyDashboardsFinish(contextWithMessageId, state);
    await onInputAvailable(mockInput);

    expect(consoleSpy).toHaveBeenCalledWith(
      '[modify-dashboards] Failed to update with final input',
      expect.objectContaining({
        messageId: 'msg-123',
        error: 'DB Error',
      })
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
    await onInputAvailable(emptyInput);

    expect(state.parsedArgs).toEqual(emptyInput);
    expect(state.files).toHaveLength(0);
  });

  it('should log processing duration when processingStartTime is available', async () => {
    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
      processingStartTime: Date.now() - 1000, // 1 second ago
    };

    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const onInputAvailable = createModifyDashboardsFinish(mockContext, state);
    await onInputAvailable(mockInput);

    expect(consoleSpy).toHaveBeenCalledWith(
      '[modify-dashboards] Input processing duration',
      expect.objectContaining({
        duration: expect.any(Number),
      })
    );

    consoleSpy.mockRestore();
  });
});
