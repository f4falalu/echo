import { updateMessageFields } from '@buster/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCreateMetricsFinish } from './create-metrics-finish';
import type { CreateMetricsInput, CreateMetricsState } from './create-metrics-tool';

// Mock the database module
vi.mock('@buster/database', () => ({
  updateMessageFields: vi.fn(),
}));

describe('createCreateMetricsFinish', () => {
  const mockContext = {
    userId: 'user-123',
    chatId: 'chat-456',
    dataSourceId: 'ds-789',
    dataSourceSyntax: 'postgresql',
    organizationId: 'org-abc',
    messageId: 'msg-xyz',
  };

  let state: CreateMetricsState;

  beforeEach(() => {
    vi.clearAllMocks();
    state = {
      argsText: '',
      files: [],
      messageId: mockContext.messageId,
      toolCallId: 'tool-123',
      reasoningEntryId: 'reasoning-456',
      processingStartTime: Date.now() - 5000, // 5 seconds ago
    };
  });

  it('should update state with complete input', async () => {
    const input: CreateMetricsInput = {
      files: [
        { name: 'metric1', yml_content: 'content1' },
        { name: 'metric2', yml_content: 'content2' },
      ],
    };

    const handler = createCreateMetricsFinish(mockContext, state);
    await handler(input);

    expect(state.parsedArgs).toEqual(input);
    expect(state.files).toHaveLength(2);
    expect(state.files[0]).toMatchObject({
      name: 'metric1',
      yml_content: 'content1',
      status: 'processing',
    });
  });

  it('should preserve existing file data when updating', async () => {
    // Set up initial state with some processed files
    state.files = [
      { name: 'metric1', yml_content: 'old_content', status: 'processing', id: 'id1', version: 1 },
      { name: 'metric2', yml_content: 'old_content', status: 'failed', error: 'Some error' },
    ];

    const input: CreateMetricsInput = {
      files: [
        { name: 'metric1', yml_content: 'new_content1' },
        { name: 'metric2', yml_content: 'new_content2' },
      ],
    };

    const handler = createCreateMetricsFinish(mockContext, state);
    await handler(input);

    // Should preserve id and version from existing files
    expect(state.files[0]).toMatchObject({
      name: 'metric1',
      yml_content: 'new_content1',
      status: 'processing',
      id: 'id1',
      version: 1,
    });

    // Should preserve error from existing file
    expect(state.files[1]).toMatchObject({
      name: 'metric2',
      yml_content: 'new_content2',
      status: 'failed',
      error: 'Some error',
    });
  });

  it('should update database when messageId and reasoningEntryId exist', async () => {
    const input: CreateMetricsInput = {
      files: [{ name: 'metric1', yml_content: 'content1' }],
    };

    const handler = createCreateMetricsFinish(mockContext, state);
    await handler(input);

    expect(updateMessageFields).toHaveBeenCalledWith(
      'msg-xyz',
      expect.objectContaining({
        reasoning: expect.arrayContaining([
          expect.objectContaining({
            id: 'tool-123',
            type: 'files',
            status: 'loading',
            title: 'Building new metrics...',
          }),
        ]),
      })
    );
  });

  it('should not update database when messageId is missing', async () => {
    const contextWithoutMessageId = {
      ...mockContext,
      messageId: undefined,
    };

    const input: CreateMetricsInput = {
      files: [{ name: 'metric1', yml_content: 'content1' }],
    };

    const handler = createCreateMetricsFinish(contextWithoutMessageId, state);
    await handler(input);

    expect(updateMessageFields).not.toHaveBeenCalled();
  });

  it('should not update database when reasoningEntryId is missing', async () => {
    state.reasoningEntryId = undefined;

    const input: CreateMetricsInput = {
      files: [{ name: 'metric1', yml_content: 'content1' }],
    };

    const handler = createCreateMetricsFinish(mockContext, state);
    await handler(input);

    expect(updateMessageFields).not.toHaveBeenCalled();
  });

  it('should handle database errors gracefully', async () => {
    vi.mocked(updateMessageFields).mockRejectedValue(new Error('Database error'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const input: CreateMetricsInput = {
      files: [{ name: 'metric1', yml_content: 'content1' }],
    };

    const handler = createCreateMetricsFinish(mockContext, state);
    await handler(input);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[create-metrics] Failed to finalize streaming data',
      expect.objectContaining({
        messageId: 'msg-xyz',
        error: 'Database error',
      })
    );

    consoleErrorSpy.mockRestore();
  });

  it('should calculate processing time when available', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const input: CreateMetricsInput = {
      files: [{ name: 'metric1', yml_content: 'content1' }],
    };

    const handler = createCreateMetricsFinish(mockContext, state);
    await handler(input);

    expect(consoleInfoSpy).toHaveBeenCalledWith(
      '[create-metrics] Finalizing streaming data',
      expect.objectContaining({
        messageId: 'msg-xyz',
        fileCount: 1,
        processingTime: expect.any(Number),
        toolCallId: 'tool-123',
      })
    );

    consoleInfoSpy.mockRestore();
  });

  it('should handle empty files array', async () => {
    const input: CreateMetricsInput = {
      files: [],
    };

    const handler = createCreateMetricsFinish(mockContext, state);
    await handler(input);

    expect(state.files).toHaveLength(0);
    expect(state.parsedArgs).toEqual(input);
  });

  it('should log input information', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const input: CreateMetricsInput = {
      files: [
        { name: 'metric1', yml_content: 'content1' },
        { name: 'metric2', yml_content: 'content2' },
      ],
    };

    const handler = createCreateMetricsFinish(mockContext, state);
    await handler(input);

    expect(consoleInfoSpy).toHaveBeenCalledWith(
      '[create-metrics] Input fully available',
      expect.objectContaining({
        fileCount: 2,
        fileNames: ['metric1', 'metric2'],
        messageId: 'msg-xyz',
        timestamp: expect.any(String),
      })
    );

    consoleInfoSpy.mockRestore();
  });

  it('should mark all files as processing when not already set', async () => {
    state.files = [
      { name: 'metric1', yml_content: 'content1' },
      { name: 'metric2', yml_content: 'content2', status: 'completed' },
    ];

    const input: CreateMetricsInput = {
      files: [
        { name: 'metric1', yml_content: 'content1' },
        { name: 'metric2', yml_content: 'content2' },
      ],
    };

    const handler = createCreateMetricsFinish(mockContext, state);
    await handler(input);

    // First file should get processing status
    expect(state.files[0].status).toBe('processing');
    // Second file should keep its completed status
    expect(state.files[1].status).toBe('completed');
  });

  it('should handle files added during streaming', async () => {
    // State has more files than input (shouldn't happen, but handle gracefully)
    state.files = [
      { name: 'metric1', yml_content: 'content1', status: 'processing' },
      { name: 'metric2', yml_content: 'content2', status: 'processing' },
      { name: 'metric3', yml_content: 'content3', status: 'processing' },
    ];

    const input: CreateMetricsInput = {
      files: [
        { name: 'metric1', yml_content: 'updated1' },
        { name: 'metric2', yml_content: 'updated2' },
      ],
    };

    const handler = createCreateMetricsFinish(mockContext, state);
    await handler(input);

    // Should only have files from input
    expect(state.files).toHaveLength(2);
    expect(state.files[0].yml_content).toBe('updated1');
    expect(state.files[1].yml_content).toBe('updated2');
  });
});
