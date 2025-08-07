import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCreateDashboardsStart } from './create-dashboards-start';
import type {
  CreateDashboardsAgentContext,
  CreateDashboardsInput,
  CreateDashboardsState,
} from './create-dashboards-tool';

vi.mock('@buster/database', () => ({
  insertMessageReasoning: vi.fn(),
}));

describe('createCreateDashboardsStart', () => {
  let context: CreateDashboardsAgentContext;
  let state: CreateDashboardsState;
  let insertMessageReasoning: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    insertMessageReasoning = vi.mocked((await import('@buster/database')).insertMessageReasoning);

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
    };
  });

  it('should initialize state with processing start time and tool call ID', async () => {
    const input: CreateDashboardsInput = {
      files: [{ name: 'Dashboard 1', yml_content: 'content1' }],
    };

    const handler = createCreateDashboardsStart(context, state);
    await handler(input);

    expect(state.processingStartTime).toBeDefined();
    expect(state.toolCallId).toBeDefined();
    expect(state.toolCallId).toMatch(/^tool-\d+-\w+$/);
  });

  it('should create initial reasoning entry when messageId exists', async () => {
    insertMessageReasoning.mockResolvedValue({ id: 'reasoning-1' });

    const input: CreateDashboardsInput = {
      files: [{ name: 'Dashboard 1', yml_content: 'content1' }],
    };

    const handler = createCreateDashboardsStart(context, state);
    await handler(input);

    expect(insertMessageReasoning).toHaveBeenCalledWith(
      'msg-1',
      expect.objectContaining({
        type: 'files',
        title: 'Building new dashboards...',
        status: 'loading',
        file_ids: [],
        files: {},
      })
    );

    expect(state.reasoningEntryId).toBe('reasoning-1');
  });

  it('should not create reasoning entry when messageId is undefined', async () => {
    const contextWithoutMessageId = { ...context, messageId: undefined };
    const stateWithoutMessageId = { ...state, messageId: undefined };

    const input: CreateDashboardsInput = {
      files: [{ name: 'Dashboard 1', yml_content: 'content1' }],
    };

    const handler = createCreateDashboardsStart(contextWithoutMessageId, stateWithoutMessageId);
    await handler(input);

    expect(insertMessageReasoning).not.toHaveBeenCalled();
    expect(stateWithoutMessageId.reasoningEntryId).toBeUndefined();
  });

  it('should handle database errors gracefully', async () => {
    insertMessageReasoning.mockRejectedValue(new Error('Database error'));

    const input: CreateDashboardsInput = {
      files: [{ name: 'Dashboard 1', yml_content: 'content1' }],
    };

    const handler = createCreateDashboardsStart(context, state);

    // Should not throw
    await expect(handler(input)).resolves.not.toThrow();

    // State should still be initialized
    expect(state.processingStartTime).toBeDefined();
    expect(state.toolCallId).toBeDefined();
    // But reasoningEntryId should not be set due to error
    expect(state.reasoningEntryId).toBeUndefined();
  });

  it('should handle empty files array', async () => {
    insertMessageReasoning.mockResolvedValue({ id: 'reasoning-1' });

    const input: CreateDashboardsInput = {
      files: [],
    };

    const handler = createCreateDashboardsStart(context, state);
    await handler(input);

    expect(state.processingStartTime).toBeDefined();
    expect(state.toolCallId).toBeDefined();
    expect(insertMessageReasoning).toHaveBeenCalled();
  });

  it('should handle multiple files', async () => {
    insertMessageReasoning.mockResolvedValue({ id: 'reasoning-1' });

    const input: CreateDashboardsInput = {
      files: [
        { name: 'Dashboard 1', yml_content: 'content1' },
        { name: 'Dashboard 2', yml_content: 'content2' },
        { name: 'Dashboard 3', yml_content: 'content3' },
      ],
    };

    const handler = createCreateDashboardsStart(context, state);
    await handler(input);

    expect(state.processingStartTime).toBeDefined();
    expect(state.toolCallId).toBeDefined();
    expect(state.reasoningEntryId).toBe('reasoning-1');
  });
});
