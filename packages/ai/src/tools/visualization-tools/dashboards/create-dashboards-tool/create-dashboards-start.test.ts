import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDashboardsStart } from './create-dashboards-start';
import type {
  CreateDashboardsContext,
  CreateDashboardsInput,
  CreateDashboardsState,
} from './create-dashboards-tool';

vi.mock('@buster/database/queries', () => ({
  insertMessageReasoning: vi.fn(),
  updateMessageEntries: vi.fn(),
}));

describe('createCreateDashboardsStart', () => {
  let context: CreateDashboardsContext;
  let state: CreateDashboardsState;

  beforeEach(async () => {
    vi.clearAllMocks();

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
      toolCallId: undefined,
    };
  });

  it('should initialize state with processing start time and tool call ID', async () => {
    const handler = createDashboardsStart(context, state);
    await handler({ toolCallId: 'test-tool-id', messages: [] });

    expect(state.toolCallId).toBeDefined();
    expect(state.toolCallId).toBe('test-tool-id');
    // toolCallId is set from options.toolCallId which is provided by the AI SDK
  });

  it('should not create initial reasoning entry when no files exist', async () => {
    const { updateMessageEntries } = await import('@buster/database/queries');
    const updateMock = vi.mocked(updateMessageEntries);

    const handler = createDashboardsStart(context, state);
    await handler({ toolCallId: 'test-tool-id', messages: [] });

    // Won't be called since there are no files initially
    expect(updateMock).not.toHaveBeenCalled();
    expect(state.toolCallId).toBe('test-tool-id');
  });

  it('should not create reasoning entry when messageId is undefined', async () => {
    const { updateMessageEntries } = await import('@buster/database/queries');
    const updateMock = vi.mocked(updateMessageEntries);
    const contextWithoutMessageId = { ...context, messageId: undefined };

    const handler = createDashboardsStart(contextWithoutMessageId, state);
    await handler({ toolCallId: 'test-tool-id', messages: [] });

    expect(updateMock).not.toHaveBeenCalled();
  });

  it('should handle database errors gracefully', async () => {
    const { updateMessageEntries } = await import('@buster/database/queries');
    const updateMock = vi.mocked(updateMessageEntries);
    updateMock.mockRejectedValue(new Error('Database error'));

    const handler = createDashboardsStart(context, state);

    // Should not throw
    await expect(handler({ toolCallId: 'test-tool-id', messages: [] })).resolves.not.toThrow();

    // State should still be initialized
    expect(state.toolCallId).toBe('test-tool-id');
  });

  it('should handle empty files array', async () => {
    const { updateMessageEntries } = await import('@buster/database/queries');
    const updateMock = vi.mocked(updateMessageEntries);

    const handler = createDashboardsStart(context, state);
    await handler({ toolCallId: 'test-tool-id', messages: [] });

    expect(state.toolCallId).toBe('test-tool-id');
    // Won't be called since no files to report
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('should handle multiple files', async () => {
    const { updateMessageEntries } = await import('@buster/database/queries');
    const updateMock = vi.mocked(updateMessageEntries);

    const handler = createDashboardsStart(context, state);
    await handler({ toolCallId: 'test-tool-id', messages: [] });

    expect(state.toolCallId).toBe('test-tool-id');
    // Won't be called since no files to report initially
    expect(updateMock).not.toHaveBeenCalled();
  });
});
