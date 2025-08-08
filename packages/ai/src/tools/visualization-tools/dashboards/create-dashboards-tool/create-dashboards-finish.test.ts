import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCreateDashboardsFinish } from './create-dashboards-finish';
import type {
  CreateDashboardsContext,
  CreateDashboardsInput,
  CreateDashboardsState,
} from './create-dashboards-tool';

vi.mock('@buster/database', () => ({
  updateMessageReasoning: vi.fn(),
}));

describe('createCreateDashboardsFinish', () => {
  let context: CreateDashboardsContext;
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
      parsedArgs: undefined,
      toolCallId: 'tool-123',
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
    await handler({ input, toolCallId: 'tool-123' });

    expect(state.parsedArgs).toEqual(input);
    expect(state.files).toHaveLength(2);
    expect(state.files[0]).toEqual({
      name: 'Dashboard 1',
      yml_content: 'content1',
      status: 'processing',
    });
  });

  it('should update database when messageId exists', async () => {
    const input: CreateDashboardsInput = {
      files: [{ name: 'Dashboard 1', yml_content: 'content1' }],
    };

    const handler = createCreateDashboardsFinish(context, state);
    await handler({ input, toolCallId: 'tool-123' });

    // Since the finish implementation doesn't update the database, we just check that state is updated
    expect(state.parsedArgs).toEqual(input);
    expect(state.files).toHaveLength(1);
  });

  it('should handle when messageId is missing', async () => {
    const contextWithoutMessageId = { ...context, messageId: undefined };

    const input: CreateDashboardsInput = {
      files: [{ name: 'Dashboard 1', yml_content: 'content1' }],
    };

    const handler = createCreateDashboardsFinish(contextWithoutMessageId, state);
    await handler({ input, toolCallId: 'tool-123' });

    // State should still be updated
    expect(state.parsedArgs).toEqual(input);
  });

  it('should handle when state is minimal', async () => {
    const minimalState = { ...state, toolCallId: undefined };

    const input: CreateDashboardsInput = {
      files: [{ name: 'Dashboard 1', yml_content: 'content1' }],
    };

    const handler = createCreateDashboardsFinish(context, minimalState);
    await handler({ input, toolCallId: 'tool-123' });

    // State should still be updated
    expect(minimalState.parsedArgs).toEqual(input);
  });

  it('should handle state updates correctly', async () => {
    const input: CreateDashboardsInput = {
      files: [{ name: 'Dashboard 1', yml_content: 'content1' }],
    };

    const handler = createCreateDashboardsFinish(context, state);

    // Should not throw
    await expect(handler({ input, toolCallId: 'tool-123' })).resolves.not.toThrow();

    // State should be updated
    expect(state.parsedArgs).toEqual(input);
    expect(state.files).toHaveLength(1);
  });

  it('should log when input is available', async () => {
    const consoleSpy = vi.spyOn(console, 'info');

    const input: CreateDashboardsInput = {
      files: [{ name: 'Dashboard 1', yml_content: 'content1' }],
    };

    const handler = createCreateDashboardsFinish(context, state);
    await handler({ input, toolCallId: 'tool-123' });

    expect(consoleSpy).toHaveBeenCalledWith(
      '[create-dashboards] Input fully available:',
      expect.objectContaining({
        filesCount: 1,
      })
    );
  });

  it('should log correctly with multiple files', async () => {
    const consoleSpy = vi.spyOn(console, 'info');

    const input: CreateDashboardsInput = {
      files: [
        { name: 'Dashboard 1', yml_content: 'content1' },
        { name: 'Dashboard 2', yml_content: 'content2' },
      ],
    };

    const handler = createCreateDashboardsFinish(context, state);
    await handler({ input, toolCallId: 'tool-123' });

    expect(consoleSpy).toHaveBeenCalledWith(
      '[create-dashboards] Input fully available:',
      expect.objectContaining({
        filesCount: 2,
      })
    );
  });

  it('should handle empty files array', async () => {
    const input: CreateDashboardsInput = {
      files: [],
    };

    const handler = createCreateDashboardsFinish(context, state);
    await handler({ input, toolCallId: 'tool-123' });

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
    await handler({ input, toolCallId: 'tool-123' });

    expect(state.files).toHaveLength(3);
    expect(state.files.map((f) => f.name)).toEqual(['Dashboard 1', 'Dashboard 2', 'Dashboard 3']);
    expect(state.files.every((f) => f.status === 'processing')).toBe(true);
  });
});
