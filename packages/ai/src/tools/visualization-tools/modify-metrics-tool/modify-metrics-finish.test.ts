import { updateMessageFields } from '@buster/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createModifyMetricsFinish } from './modify-metrics-finish';
import type { ModifyMetricsInput, ModifyMetricsState } from './modify-metrics-tool';

vi.mock('@buster/database', () => ({
  updateMessageFields: vi.fn(),
}));

describe('createModifyMetricsFinish', () => {
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
      toolCallId: 'tool-123',
      reasoningEntryId: 'reasoning-123',
      processingStartTime: Date.now() - 1000, // Started 1 second ago
    };
    context = {
      userId: 'user-123',
      chatId: 'chat-123',
      dataSourceId: 'ds-123',
      dataSourceSyntax: 'postgres',
      organizationId: 'org-123',
      messageId: 'msg-123',
    };
  });

  it('should store complete input in state', async () => {
    const input: ModifyMetricsInput = {
      files: [
        { id: 'metric-1', yml_content: 'content1' },
        { id: 'metric-2', yml_content: 'content2' },
      ],
    };

    const finishHandler = createModifyMetricsFinish(context, state);
    await finishHandler(input);

    expect(state.parsedArgs).toEqual(input);
  });

  it('should update state files with final data', async () => {
    const input: ModifyMetricsInput = {
      files: [
        { id: 'metric-1', yml_content: 'content1' },
        { id: 'metric-2', yml_content: 'content2' },
      ],
    };

    const finishHandler = createModifyMetricsFinish(context, state);
    await finishHandler(input);

    expect(state.files).toHaveLength(2);
    expect(state.files[0]).toEqual({
      id: 'metric-1',
      yml_content: 'content1',
      name: undefined,
      status: 'processing',
    });
    expect(state.files[1]).toEqual({
      id: 'metric-2',
      yml_content: 'content2',
      name: undefined,
      status: 'processing',
    });
  });

  it('should update database when messageId and reasoningEntryId exist', async () => {
    const input: ModifyMetricsInput = {
      files: [{ id: 'metric-1', yml_content: 'content1' }],
    };

    const finishHandler = createModifyMetricsFinish(context, state);
    await finishHandler(input);

    expect(updateMessageFields).toHaveBeenCalledWith('msg-123', {
      reasoning: expect.arrayContaining([
        expect.objectContaining({
          id: 'tool-123',
          type: 'files',
          title: 'Modifying metrics...',
          status: 'loading',
          file_ids: ['metric-1'],
        }),
      ]),
      rawLlmMessages: expect.arrayContaining([
        expect.objectContaining({
          type: 'tool-call',
          toolCallId: 'tool-123',
          toolName: 'modify-metrics-file',
          args: input,
        }),
      ]),
    });
  });

  it('should not update database when messageId is missing', async () => {
    context.messageId = undefined;

    const input: ModifyMetricsInput = {
      files: [{ id: 'metric-1', yml_content: 'content1' }],
    };

    const finishHandler = createModifyMetricsFinish(context, state);
    await finishHandler(input);

    expect(updateMessageFields).not.toHaveBeenCalled();
  });

  it('should not update database when reasoningEntryId is missing', async () => {
    state.reasoningEntryId = undefined;

    const input: ModifyMetricsInput = {
      files: [{ id: 'metric-1', yml_content: 'content1' }],
    };

    const finishHandler = createModifyMetricsFinish(context, state);
    await finishHandler(input);

    expect(updateMessageFields).not.toHaveBeenCalled();
  });

  it('should handle database update errors gracefully', async () => {
    (updateMessageFields as any).mockRejectedValue(new Error('Database error'));

    const input: ModifyMetricsInput = {
      files: [{ id: 'metric-1', yml_content: 'content1' }],
    };

    const finishHandler = createModifyMetricsFinish(context, state);

    // Should not throw
    await expect(finishHandler(input)).resolves.not.toThrow();

    // State should still be updated
    expect(state.parsedArgs).toEqual(input);
    expect(state.files).toHaveLength(1);
  });

  it('should log processing time when processingStartTime exists', async () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const input: ModifyMetricsInput = {
      files: [{ id: 'metric-1', yml_content: 'content1' }],
    };

    const finishHandler = createModifyMetricsFinish(context, state);
    await finishHandler(input);

    expect(consoleSpy).toHaveBeenCalledWith(
      '[modify-metrics] Input processing time',
      expect.objectContaining({
        processingTimeMs: expect.any(Number),
        processingTimeSeconds: expect.any(String),
      })
    );

    consoleSpy.mockRestore();
  });

  it('should not log processing time when processingStartTime is missing', async () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    state.processingStartTime = undefined;

    const input: ModifyMetricsInput = {
      files: [{ id: 'metric-1', yml_content: 'content1' }],
    };

    const finishHandler = createModifyMetricsFinish(context, state);
    await finishHandler(input);

    const calls = consoleSpy.mock.calls;
    const processingTimeCall = calls.find(
      (call) => call[0] === '[modify-metrics] Input processing time'
    );

    expect(processingTimeCall).toBeUndefined();

    consoleSpy.mockRestore();
  });

  it('should handle empty files array', async () => {
    const input: ModifyMetricsInput = {
      files: [],
    };

    const finishHandler = createModifyMetricsFinish(context, state);
    await finishHandler(input);

    expect(state.files).toHaveLength(0);
    expect(state.parsedArgs).toEqual(input);

    expect(updateMessageFields).toHaveBeenCalledWith('msg-123', {
      reasoning: expect.arrayContaining([
        expect.objectContaining({
          file_ids: [],
          files: {},
        }),
      ]),
      rawLlmMessages: expect.any(Array),
    });
  });

  it('should use fallback toolCallId when not set in state', async () => {
    state.toolCallId = undefined;

    const input: ModifyMetricsInput = {
      files: [{ id: 'metric-1', yml_content: 'content1' }],
    };

    const finishHandler = createModifyMetricsFinish(context, state);
    await finishHandler(input);

    expect(updateMessageFields).toHaveBeenCalledWith('msg-123', {
      reasoning: expect.arrayContaining([
        expect.objectContaining({
          id: expect.stringMatching(/^modify-metrics-\d+$/),
        }),
      ]),
      rawLlmMessages: expect.arrayContaining([
        expect.objectContaining({
          toolCallId: expect.stringMatching(/^modify-metrics-\d+$/),
        }),
      ]),
    });
  });

  it('should log correct information', async () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const input: ModifyMetricsInput = {
      files: [
        { id: 'metric-1', yml_content: 'content1' },
        { id: 'metric-2', yml_content: 'content2' },
      ],
    };

    const finishHandler = createModifyMetricsFinish(context, state);
    await finishHandler(input);

    expect(consoleSpy).toHaveBeenCalledWith(
      '[modify-metrics] Input fully available',
      expect.objectContaining({
        fileCount: 2,
        fileIds: ['metric-1', 'metric-2'],
        messageId: 'msg-123',
        timestamp: expect.any(String),
      })
    );

    consoleSpy.mockRestore();
  });
});
