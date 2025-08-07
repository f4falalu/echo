import { updateMessageFields } from '@buster/database';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createModifyDashboardsFinish } from './modify-dashboards-finish';
import type {
  ModifyDashboardsAgentContext,
  ModifyDashboardsInput,
  ModifyDashboardsState,
} from './modify-dashboards-tool';

vi.mock('@buster/database', () => ({
  updateMessageFields: vi.fn(),
}));

describe('modify-dashboards-finish', () => {
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

    const onInputAvailable = createModifyDashboardsFinish(contextWithMessageId, state);
    await onInputAvailable(mockInput);

    expect(updateMessageFields).toHaveBeenCalledWith(
      'msg-123',
      expect.objectContaining({
        reasoning: expect.arrayContaining([
          expect.objectContaining({
            id: 'tool-123',
            type: 'files',
            status: 'loading',
            file_ids: ['dash-1', 'dash-2'],
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

    const onInputAvailable = createModifyDashboardsFinish(mockContext, state);
    await onInputAvailable(mockInput);

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

    const onInputAvailable = createModifyDashboardsFinish(contextWithMessageId, state);
    await onInputAvailable(mockInput);

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

  it('should log processing duration when processingStartTime exists', async () => {
    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
      processingStartTime: Date.now() - 1000,
    };

    const consoleSpy = vi.spyOn(console, 'info');

    const onInputAvailable = createModifyDashboardsFinish(mockContext, state);
    await onInputAvailable(mockInput);

    expect(consoleSpy).toHaveBeenCalledWith(
      '[modify-dashboards] Input processing duration',
      expect.objectContaining({
        duration: expect.any(Number),
      })
    );
  });

  it('should handle empty input files', async () => {
    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
    };

    const emptyInput: ModifyDashboardsInput = {
      files: [],
    };

    const onInputAvailable = createModifyDashboardsFinish(mockContext, state);
    await onInputAvailable(emptyInput);

    expect(state.files).toHaveLength(0);
    expect(state.parsedArgs).toEqual(emptyInput);
  });

  it('should generate toolCallId if not present', async () => {
    const contextWithMessageId = {
      ...mockContext,
      messageId: 'msg-123',
    };

    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
      messageId: 'msg-123',
      reasoningEntryId: 'reasoning-123',
      // No toolCallId
    };

    const onInputAvailable = createModifyDashboardsFinish(contextWithMessageId, state);
    await onInputAvailable(mockInput);

    expect(updateMessageFields).toHaveBeenCalledWith(
      'msg-123',
      expect.objectContaining({
        reasoning: expect.arrayContaining([
          expect.objectContaining({
            id: expect.stringContaining('modify-dashboards-'),
          }),
        ]),
      })
    );
  });
});
