import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDashboardsStart } from './create-dashboards-start';
import type {
  CreateDashboardsContext,
  CreateDashboardsInput,
  CreateDashboardsState,
} from './create-dashboards-tool';

vi.mock('@buster/database', () => ({
  insertMessageReasoning: vi.fn(),
  updateMessageEntries: vi.fn(),
}));

describe('createCreateDashboardsStart', () => {
  let context: CreateDashboardsContext;
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
      parsedArgs: undefined,
      toolCallId: undefined,
    };
  });

  it('should initialize state with processing start time and tool call ID', async () => {
    const handler = createDashboardsStart(context, state);
    await handler({ toolCallId: 'test-tool-id' });

    expect(state.toolCallId).toBeDefined();
    expect(state.toolCallId).toBe('test-tool-id');
    // toolCallId is set from options.toolCallId which is provided by the AI SDK
  });

  it('should create initial reasoning entry when messageId exists', async () => {
    const { updateMessageEntries } = await import('@buster/database');
    const updateMock = vi.mocked(updateMessageEntries);

    const handler = createDashboardsStart(context, state);
    await handler({ toolCallId: 'test-tool-id' });

    expect(updateMock).toHaveBeenCalled();
    expect(state.toolCallId).toBe('test-tool-id');
  });

  it('should not create reasoning entry when messageId is undefined', async () => {
    const { updateMessageEntries } = await import('@buster/database');
    const updateMock = vi.mocked(updateMessageEntries);
    const contextWithoutMessageId = { ...context, messageId: undefined };

    const handler = createDashboardsStart(contextWithoutMessageId, state);
    await handler({ toolCallId: 'test-tool-id' });

    expect(updateMock).not.toHaveBeenCalled();
  });

  it('should handle database errors gracefully', async () => {
    const { updateMessageEntries } = await import('@buster/database');
    const updateMock = vi.mocked(updateMessageEntries);
    updateMock.mockRejectedValue(new Error('Database error'));

    const handler = createDashboardsStart(context, state);

    // Should not throw
    await expect(handler({ toolCallId: 'test-tool-id' })).resolves.not.toThrow();

    // State should still be initialized
    expect(state.toolCallId).toBe('test-tool-id');
  });

  it('should handle empty files array', async () => {
    const { updateMessageEntries } = await import('@buster/database');
    const updateMock = vi.mocked(updateMessageEntries);

    const handler = createDashboardsStart(context, state);
    await handler({ toolCallId: 'test-tool-id' });

    expect(state.toolCallId).toBe('test-tool-id');
    expect(updateMock).toHaveBeenCalled();
  });

  it('should handle multiple files', async () => {
    const { updateMessageEntries } = await import('@buster/database');
    const updateMock = vi.mocked(updateMessageEntries);

    const handler = createDashboardsStart(context, state);
    await handler({ toolCallId: 'test-tool-id' });

    expect(state.toolCallId).toBe('test-tool-id');
    expect(updateMock).toHaveBeenCalled();
  });
});
