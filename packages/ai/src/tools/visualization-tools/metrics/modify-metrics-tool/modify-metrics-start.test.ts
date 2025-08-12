import { updateMessageEntries } from '@buster/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createModifyMetricsStart } from './modify-metrics-start';
import type { ModifyMetricsInput, ModifyMetricsState } from './modify-metrics-tool';

vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn(),
}));

describe('createModifyMetricsStart', () => {
  let state: ModifyMetricsState;
  let context: {
    messageId?: string;
    userId: string;
    chatId: string;
    dataSourceId: string;
    dataSourceSyntax: string;
    organizationId: string;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    state = {
      argsText: '',
      files: [],
    };
    context = {
      userId: 'user-123',
      chatId: 'chat-123',
      dataSourceId: 'ds-123',
      dataSourceSyntax: 'postgres',
      organizationId: 'org-123',
    };
  });

  it('should initialize state with toolCallId', async () => {
    const input: ModifyMetricsInput = {
      files: [
        { id: 'metric-1', yml_content: 'content1' },
        { id: 'metric-2', yml_content: 'content2' },
      ],
    };

    const startHandler = createModifyMetricsStart(context, state);
    await startHandler({ toolCallId: 'tool-123', messages: [] });

    expect(state.toolCallId).toBeDefined();
    expect(state.toolCallId).toBe('tool-123');
  });

  it('should create database entries when messageId exists', async () => {
    context.messageId = 'msg-123';
    // Add files to state before the call since that's what triggers entry creation
    state.files = [
      {
        id: 'metric-1',
        file_type: 'metric',
        version_number: 1,
        status: 'loading',
        file: { text: 'content' },
      },
    ];

    const startHandler = createModifyMetricsStart(context, state);
    await startHandler({ toolCallId: 'tool-123', messages: [] });

    expect(updateMessageEntries).toHaveBeenCalledTimes(1);
    expect(updateMessageEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: 'msg-123',
        mode: 'append',
      })
    );

    expect(state.toolCallId).toBe('tool-123');
  });

  it('should not create database entries when messageId is missing', async () => {
    // No messageId in context
    const startHandler = createModifyMetricsStart(context, state);
    await startHandler({ toolCallId: 'tool-123', messages: [] });

    expect(updateMessageEntries).not.toHaveBeenCalled();
    expect(state.toolCallId).toBe('tool-123'); // toolCallId should still be set
  });

  it('should handle database errors gracefully', async () => {
    context.messageId = 'msg-123';
    // Add files to state to trigger database update
    state.files = [
      {
        id: 'metric-1',
        file_type: 'metric',
        version_number: 1,
        status: 'loading',
        file: { text: 'content' },
      },
    ];

    (updateMessageEntries as any).mockRejectedValue(new Error('Database error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const startHandler = createModifyMetricsStart(context, state);

    // Should not throw
    await expect(startHandler({ toolCallId: 'tool-123', messages: [] })).resolves.not.toThrow();

    expect(updateMessageEntries).toHaveBeenCalled();
    // State should still be initialized even if database fails
    expect(state.toolCallId).toBe('tool-123');

    expect(consoleSpy).toHaveBeenCalledWith(
      '[modify-metrics] Error updating entries on start:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('should handle empty files array', async () => {
    context.messageId = 'msg-123';
    // state.files is already empty from beforeEach

    const startHandler = createModifyMetricsStart(context, state);
    await startHandler({ toolCallId: 'tool-123', messages: [] });

    expect(state.toolCallId).toBe('tool-123');
    // Should not call database when no files exist
    expect(updateMessageEntries).not.toHaveBeenCalled();
  });

  it('should not log information', async () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const startHandler = createModifyMetricsStart(context, state);
    await startHandler({ toolCallId: 'tool-123', messages: [] });

    // The implementation doesn't log info messages
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should work with both messageId present and absent', async () => {
    // First test without messageId
    let startHandler = createModifyMetricsStart(context, state);
    await startHandler({ toolCallId: 'tool-123', messages: [] });

    expect(updateMessageEntries).not.toHaveBeenCalled();
    expect(state.toolCallId).toBe('tool-123');

    // Reset state for second test
    state = {
      argsText: '',
      files: [
        {
          id: 'metric-1',
          file_type: 'metric',
          version_number: 1,
          status: 'loading',
          file: { text: 'content' },
        },
      ],
    };

    // Reset mocks for clean second test
    vi.clearAllMocks();
    // Mock successful database update for the second test
    (updateMessageEntries as any).mockResolvedValue(undefined);

    // Now test with messageId
    context.messageId = 'msg-456';
    startHandler = createModifyMetricsStart(context, state);
    await startHandler({ toolCallId: 'tool-456', messages: [] });

    expect(updateMessageEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: 'msg-456',
        mode: 'append',
      })
    );
    expect(state.toolCallId).toBe('tool-456');
  });
});
