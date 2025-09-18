import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCreateDashboardsFinish } from './create-dashboards-finish';
import type {
  CreateDashboardsContext,
  CreateDashboardsInput,
  CreateDashboardsState,
} from './create-dashboards-tool';

vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn(),
}));

describe('createCreateDashboardsFinish', () => {
  let context: CreateDashboardsContext;
  let state: CreateDashboardsState;
  let updateMessageEntries: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    updateMessageEntries = vi.mocked(
      (await import('@buster/database/queries')).updateMessageEntries
    );

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
    await handler({ input, toolCallId: 'tool-123', messages: [] });

    expect(state.files).toHaveLength(2);
    expect(state.files![0]).toMatchObject({
      file_name: 'Dashboard 1',
      file_type: 'dashboard_file',
      version_number: 1,
      file: {
        text: 'content1',
      },
      status: 'loading',
    });
  });

  it('should update database when messageId exists', async () => {
    const input: CreateDashboardsInput = {
      files: [{ name: 'Dashboard 1', yml_content: 'content1' }],
    };

    const handler = createCreateDashboardsFinish(context, state);
    await handler({ input, toolCallId: 'tool-123', messages: [] });

    // Check that state is updated
    expect(state.files).toHaveLength(1);
    // updateMessageEntries should be called since we have a file now
    expect(updateMessageEntries).toHaveBeenCalled();
  });

  it('should handle when messageId is missing', async () => {
    const contextWithoutMessageId = { ...context, messageId: undefined };

    const input: CreateDashboardsInput = {
      files: [{ name: 'Dashboard 1', yml_content: 'content1' }],
    };

    const handler = createCreateDashboardsFinish(contextWithoutMessageId, state);
    await handler({ input, toolCallId: 'tool-123', messages: [] });

    // State should still be updated
    expect(state.files).toHaveLength(1);
    expect(updateMessageEntries).not.toHaveBeenCalled();
  });

  it('should handle when state is minimal', async () => {
    const minimalState = { ...state, toolCallId: undefined };

    const input: CreateDashboardsInput = {
      files: [{ name: 'Dashboard 1', yml_content: 'content1' }],
    };

    const handler = createCreateDashboardsFinish(context, minimalState);
    await handler({ input, toolCallId: 'tool-123', messages: [] });

    // State should still be updated
    expect(minimalState.files).toHaveLength(1);
  });

  it('should handle state updates correctly', async () => {
    const input: CreateDashboardsInput = {
      files: [{ name: 'Dashboard 1', yml_content: 'content1' }],
    };

    const handler = createCreateDashboardsFinish(context, state);

    // Should not throw
    await expect(handler({ input, toolCallId: 'tool-123', messages: [] })).resolves.not.toThrow();

    // State should be updated
    expect(state.files).toHaveLength(1);
    expect(state.files![0]).toMatchObject({
      file_name: 'Dashboard 1',
      file_type: 'dashboard_file',
    });
  });

  it('should handle empty files array', async () => {
    const input: CreateDashboardsInput = {
      files: [],
    };

    const handler = createCreateDashboardsFinish(context, state);
    await handler({ input, toolCallId: 'tool-123', messages: [] });

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
    await handler({ input, toolCallId: 'tool-123', messages: [] });

    expect(state.files).toHaveLength(3);
    expect(state.files!.map((f) => f.file_name)).toEqual([
      'Dashboard 1',
      'Dashboard 2',
      'Dashboard 3',
    ]);
    expect(state.files!.every((f) => f.status === 'loading')).toBe(true);
  });
});
