import { updateMessageFields } from '@buster/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createModifyMetricsStart } from './modify-metrics-start';
import type { ModifyMetricsInput, ModifyMetricsState } from './modify-metrics-tool';

vi.mock('@buster/database', () => ({
  updateMessageFields: vi.fn(),
  createMessageFields: vi.fn(),
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

  it('should initialize state with processingStartTime and toolCallId', async () => {
    const input: ModifyMetricsInput = {
      files: [
        { id: 'metric-1', yml_content: 'content1' },
        { id: 'metric-2', yml_content: 'content2' },
      ],
    };

    const startHandler = createModifyMetricsStart(context, state);
    await startHandler(input);

    expect(state.processingStartTime).toBeDefined();
    expect(state.processingStartTime).toBeGreaterThan(0);
    expect(state.toolCallId).toBeDefined();
    expect(state.toolCallId).toMatch(/^modify-metrics-\d+-[a-z0-9]+$/);
  });

  it('should create database entries when messageId exists', async () => {
    context.messageId = 'msg-123';
    const input: ModifyMetricsInput = {
      files: [{ id: 'metric-1', yml_content: 'content' }],
    };

    const startHandler = createModifyMetricsStart(context, state);
    await startHandler(input);

    expect(updateMessageFields).toHaveBeenCalledTimes(1);
    expect(updateMessageFields).toHaveBeenCalledWith('msg-123', {
      reasoning: expect.arrayContaining([
        expect.objectContaining({
          id: state.toolCallId,
          type: 'files',
          title: 'Modifying metrics...',
          status: 'loading',
          file_ids: [],
          files: {},
        }),
      ]),
      rawLlmMessages: expect.arrayContaining([
        expect.objectContaining({
          type: 'tool-call',
          toolCallId: state.toolCallId,
          toolName: 'modify-metrics-file',
          args: {},
        }),
      ]),
    });

    expect(state.reasoningEntryId).toBe(state.toolCallId);
  });

  it('should not create database entries when messageId is missing', async () => {
    // No messageId in context
    const input: ModifyMetricsInput = {
      files: [{ id: 'metric-1', yml_content: 'content' }],
    };

    const startHandler = createModifyMetricsStart(context, state);
    await startHandler(input);

    expect(updateMessageFields).not.toHaveBeenCalled();
    expect(state.reasoningEntryId).toBeUndefined();
  });

  it('should handle database errors gracefully', async () => {
    context.messageId = 'msg-123';
    (updateMessageFields as any).mockRejectedValue(new Error('Database error'));

    const input: ModifyMetricsInput = {
      files: [{ id: 'metric-1', yml_content: 'content' }],
    };

    const startHandler = createModifyMetricsStart(context, state);

    // Should not throw
    await expect(startHandler(input)).resolves.not.toThrow();

    expect(updateMessageFields).toHaveBeenCalled();
    // State should still be initialized even if database fails
    expect(state.processingStartTime).toBeDefined();
    expect(state.toolCallId).toBeDefined();
    // But reasoningEntryId should not be set due to error
    expect(state.reasoningEntryId).toBeUndefined();
  });

  it('should handle empty files array', async () => {
    context.messageId = 'msg-123';
    const input: ModifyMetricsInput = {
      files: [],
    };

    const startHandler = createModifyMetricsStart(context, state);
    await startHandler(input);

    expect(state.processingStartTime).toBeDefined();
    expect(state.toolCallId).toBeDefined();
    expect(updateMessageFields).toHaveBeenCalled();
  });

  it('should log correct information', async () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const input: ModifyMetricsInput = {
      files: [
        { id: 'metric-1', yml_content: 'content1' },
        { id: 'metric-2', yml_content: 'content2' },
      ],
    };

    const startHandler = createModifyMetricsStart(context, state);
    await startHandler(input);

    expect(consoleSpy).toHaveBeenCalledWith(
      '[modify-metrics] Starting metric modification',
      expect.objectContaining({
        fileCount: 2,
        messageId: undefined,
        toolCallId: state.toolCallId,
        timestamp: expect.any(String),
      })
    );

    consoleSpy.mockRestore();
  });

  it('should work with both messageId present and absent', async () => {
    // First test without messageId
    const input: ModifyMetricsInput = {
      files: [{ id: 'metric-1', yml_content: 'content' }],
    };

    let startHandler = createModifyMetricsStart(context, state);
    await startHandler(input);

    expect(updateMessageFields).not.toHaveBeenCalled();
    expect(state.reasoningEntryId).toBeUndefined();

    // Reset state for second test
    state = {
      argsText: '',
      files: [],
    };

    // Reset mocks for clean second test
    vi.clearAllMocks();
    // Mock successful database update for the second test
    (updateMessageFields as any).mockResolvedValue(undefined);

    // Now test with messageId
    context.messageId = 'msg-456';
    startHandler = createModifyMetricsStart(context, state);
    await startHandler(input);

    expect(updateMessageFields).toHaveBeenCalledWith('msg-456', expect.any(Object));
    // The reasoningEntryId should be set to the toolCallId after successful database update
    expect(state.reasoningEntryId).toBe(state.toolCallId);
    expect(state.reasoningEntryId).toBeDefined();
  });
});
