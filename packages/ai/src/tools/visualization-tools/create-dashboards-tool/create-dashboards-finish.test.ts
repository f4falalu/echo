import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCreateDashboardsFinish } from './create-dashboards-finish';
import type {
  CreateDashboardsAgentContext,
  CreateDashboardsInput,
  CreateDashboardsState,
} from './create-dashboards-tool';

vi.mock('@buster/database', () => ({
  updateMessageReasoning: vi.fn(),
}));

describe('createCreateDashboardsFinish', () => {
  let context: CreateDashboardsAgentContext;
  let state: CreateDashboardsState;
  let updateMessageReasoning: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    updateMessageReasoning = vi.mocked((await import('@buster/database')).updateMessageReasoning);

    context = {
      userId: 'user-1',
      chatId: 'chat-1',
      dataSourceId: 'ds-1',
      dataSourceSyntax: 'postgresql',
      organizationId: 'org-1',
      messageId: 'msg-1',
    };

    state = {
      argsText: '',
      files: [],
      messageId: 'msg-1',
      toolCallId: 'tool-123',
      reasoningEntryId: 'reasoning-1',
      processingStartTime: Date.now() - 1000,
    };
  });

  it('should store complete input in state', async () => {
    const input: CreateDashboardsInput = {
      files: [
        { name: 'Dashboard 1', yml_content: 'content1' },
        { name: 'Dashboard 2', yml_content: 'content2' },
      ],
    };

    const handler = createCreateDashboardsFinish(context, state);
    await handler(input);

    expect(state.parsedArgs).toEqual(input);
    expect(state.files).toHaveLength(2);
    expect(state.files[0]).toEqual({
      name: 'Dashboard 1',
      yml_content: 'content1',
      status: 'processing',
    });
  });

  it('should update database when messageId and reasoningEntryId exist', async () => {
    const input: CreateDashboardsInput = {
      files: [{ name: 'Dashboard 1', yml_content: 'content1' }],
    };

    const handler = createCreateDashboardsFinish(context, state);
    await handler(input);

    expect(updateMessageReasoning).toHaveBeenCalledWith(
      'msg-1',
      'reasoning-1',
      expect.objectContaining({
        id: 'tool-123',
        type: 'files',
        title: 'Building new dashboards...',
        status: 'loading',
      })
    );
  });

  it('should not update database when messageId is missing', async () => {
    const contextWithoutMessageId = { ...context, messageId: undefined };
    const stateWithoutMessageId = { ...state, messageId: undefined };

    const input: CreateDashboardsInput = {
      files: [{ name: 'Dashboard 1', yml_content: 'content1' }],
    };

    const handler = createCreateDashboardsFinish(contextWithoutMessageId, stateWithoutMessageId);
    await handler(input);

    expect(updateMessageReasoning).not.toHaveBeenCalled();
    // But state should still be updated
    expect(stateWithoutMessageId.parsedArgs).toEqual(input);
  });

  it('should not update database when reasoningEntryId is missing', async () => {
    const stateWithoutReasoningId = { ...state, reasoningEntryId: undefined };

    const input: CreateDashboardsInput = {
      files: [{ name: 'Dashboard 1', yml_content: 'content1' }],
    };

    const handler = createCreateDashboardsFinish(context, stateWithoutReasoningId);
    await handler(input);

    expect(updateMessageReasoning).not.toHaveBeenCalled();
    // But state should still be updated
    expect(stateWithoutReasoningId.parsedArgs).toEqual(input);
  });

  it('should handle database update errors gracefully', async () => {
    updateMessageReasoning.mockRejectedValue(new Error('Database error'));

    const input: CreateDashboardsInput = {
      files: [{ name: 'Dashboard 1', yml_content: 'content1' }],
    };

    const handler = createCreateDashboardsFinish(context, state);

    // Should not throw
    await expect(handler(input)).resolves.not.toThrow();

    // State should still be updated
    expect(state.parsedArgs).toEqual(input);
    expect(state.files).toHaveLength(1);
  });

  it('should log processing time when available', async () => {
    const consoleSpy = vi.spyOn(console, 'info');

    const input: CreateDashboardsInput = {
      files: [{ name: 'Dashboard 1', yml_content: 'content1' }],
    };

    const handler = createCreateDashboardsFinish(context, state);
    await handler(input);

    expect(consoleSpy).toHaveBeenCalledWith(
      '[create-dashboards] Input fully available',
      expect.objectContaining({
        processingTime: expect.stringMatching(/^\d+ms$/),
      })
    );
  });

  it('should log without processing time when not available', async () => {
    const consoleSpy = vi.spyOn(console, 'info');
    const stateWithoutStartTime = { ...state, processingStartTime: undefined };

    const input: CreateDashboardsInput = {
      files: [{ name: 'Dashboard 1', yml_content: 'content1' }],
    };

    const handler = createCreateDashboardsFinish(context, stateWithoutStartTime);
    await handler(input);

    expect(consoleSpy).toHaveBeenCalledWith(
      '[create-dashboards] Input fully available',
      expect.not.objectContaining({
        processingTime: expect.any(String),
      })
    );
  });

  it('should handle empty files array', async () => {
    const input: CreateDashboardsInput = {
      files: [],
    };

    const handler = createCreateDashboardsFinish(context, state);
    await handler(input);

    expect(state.parsedArgs).toEqual(input);
    expect(state.files).toHaveLength(0);
  });

  it('should handle multiple files', async () => {
    const input: CreateDashboardsInput = {
      files: [
        { name: 'Dashboard 1', yml_content: 'content1' },
        { name: 'Dashboard 2', yml_content: 'content2' },
        { name: 'Dashboard 3', yml_content: 'content3' },
      ],
    };

    const handler = createCreateDashboardsFinish(context, state);
    await handler(input);

    expect(state.files).toHaveLength(3);
    expect(state.files.map((f) => f.name)).toEqual(['Dashboard 1', 'Dashboard 2', 'Dashboard 3']);
    expect(state.files.every((f) => f.status === 'processing')).toBe(true);
  });
});
