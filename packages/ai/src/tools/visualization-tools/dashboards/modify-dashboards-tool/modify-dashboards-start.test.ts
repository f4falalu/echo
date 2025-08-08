import { createMessageEntries } from '@buster/database';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createModifyDashboardsStart } from './modify-dashboards-start';
import type {
  ModifyDashboardsContext,
  ModifyDashboardsInput,
  ModifyDashboardsState,
} from './modify-dashboards-tool';

vi.mock('@buster/database', () => ({
  createMessageEntries: vi.fn(),
  updateMessageEntries: vi.fn(),
}));

vi.mock('braintrust', () => ({
  wrapTraced: (fn: unknown, _options?: unknown) => fn,
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

  const mockInput: ModifyDashboardsInput = {
    files: [
      { id: 'dash-1', yml_content: 'content1' },
      { id: 'dash-2', yml_content: 'content2' },
    ],
  };

  it('should initialize state and log start', async () => {
    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
    };

    const onInputStart = createModifyDashboardsStart(mockContext, state);
    await onInputStart(mockInput);

    expect(state.processingStartTime).toBeDefined();
    expect(state.toolCallId).toBeDefined();
    expect(state.files).toHaveLength(2);
    expect(state.files[0]).toMatchObject({
      id: 'dash-1',
      yml_content: 'content1',
      status: 'processing',
    });
  });

  it('should create database entries when messageId exists', async () => {
    const contextWithMessageId = {
      ...mockContext,
      messageId: 'msg-123',
    };

    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
      messageId: 'msg-123',
    };

    const onInputStart = createModifyDashboardsStart(contextWithMessageId, state);
    await onInputStart(mockInput);

    expect(createMessageEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: 'msg-123',
        reasoningEntry: expect.objectContaining({
          id: state.toolCallId,
          type: 'files',
          title: 'Modifying dashboards...',
          status: 'loading',
        }),
        responseEntry: expect.objectContaining({
          id: state.toolCallId,
          type: 'text',
          message: 'Starting dashboard modification...',
          is_final_message: false,
        }),
        rawLlmMessage: expect.objectContaining({
          role: 'assistant',
          content: expect.arrayContaining([
            expect.objectContaining({
              type: 'tool-call',
              toolCallId: state.toolCallId,
              toolName: 'modify-dashboards',
            }),
          ]),
        }),
      })
    );

    expect(state.reasoningEntryId).toBeDefined();
    expect(state.responseEntryId).toBeDefined();
  });

  it('should not create database entries when messageId is missing', async () => {
    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
    };

    const onInputStart = createModifyDashboardsStart(mockContext, state);
    await onInputStart(mockInput);

    expect(createMessageEntries).not.toHaveBeenCalled();
    expect(state.reasoningEntryId).toBeUndefined();
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
    };

    vi.mocked(createMessageEntries).mockRejectedValueOnce(new Error('DB Error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const onInputStart = createModifyDashboardsStart(contextWithMessageId, state);
    await onInputStart(mockInput);

    expect(consoleSpy).toHaveBeenCalledWith(
      '[modify-dashboards] Failed to create initial database entries',
      expect.objectContaining({
        messageId: 'msg-123',
        error: 'DB Error',
      })
    );

    consoleSpy.mockRestore();
  });

  it('should handle empty input files', async () => {
    const state: ModifyDashboardsState = {
      argsText: '',
      files: [],
    };

    const emptyInput: ModifyDashboardsInput = {
      files: [],
    };

    const onInputStart = createModifyDashboardsStart(mockContext, state);
    await onInputStart(emptyInput);

    expect(state.processingStartTime).toBeDefined();
    expect(state.toolCallId).toBeDefined();
    expect(state.files).toHaveLength(0);
  });
});
