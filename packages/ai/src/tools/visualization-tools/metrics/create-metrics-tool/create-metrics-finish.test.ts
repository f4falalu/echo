import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCreateMetricsFinish } from './create-metrics-finish';
import type { CreateMetricsInput, CreateMetricsState } from './create-metrics-tool';

// Mock the database module
vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn(),
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
      argsText: undefined,
      files: undefined,
      parsedArgs: undefined,
      toolCallId: 'tool-123',
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
    await handler({
      input,
      toolCallId: 'tool-123',
      messages: [],
    });

    expect(state.parsedArgs).toEqual(input);
    expect(state.files).toBeDefined();
    expect(state.files!).toHaveLength(2);
    expect(state.files![0]).toMatchObject({
      name: 'metric1',
      yml_content: 'content1',
      status: 'processing',
    });
  });

  it('should merge with existing state files', async () => {
    // Pre-populate state with existing file data
    state.files = [
      {
        name: 'metric1',
        yml_content: '',
        status: 'processing',
        id: 'existing-id-1',
        version: 1,
      },
    ];

    const input: CreateMetricsInput = {
      files: [
        { name: 'metric1', yml_content: 'updated content' },
        { name: 'metric2', yml_content: 'content2' },
      ],
    };

    const handler = createCreateMetricsFinish(mockContext, state);
    await handler({
      input,
      toolCallId: 'tool-123',
      messages: [],
    });

    // Check that existing properties are preserved
    expect(state.files!).toHaveLength(2);
    expect(state.files![0]).toEqual({
      name: 'metric1',
      yml_content: 'updated content',
      status: 'processing',
      id: 'existing-id-1',
      version: 1,
    });
    expect(state.files![1]).toEqual({
      name: 'metric2',
      yml_content: 'content2',
      status: 'processing',
    });
  });

  it('should update database when messageId is present', async () => {
    const input: CreateMetricsInput = {
      files: [{ name: 'metric1', yml_content: 'content1' }],
    };

    const handler = createCreateMetricsFinish(mockContext, state);
    await handler({
      input,
      toolCallId: 'tool-123',
      messages: [],
    });

    expect(updateMessageEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: 'msg-xyz',
        reasoningEntry: expect.any(Object),
        mode: 'update',
      })
    );
  });

  it('should not update database when messageId is missing', async () => {
    const contextWithoutMessageId = { ...mockContext, messageId: undefined };

    const input: CreateMetricsInput = {
      files: [{ name: 'metric1', yml_content: 'content1' }],
    };

    const handler = createCreateMetricsFinish(contextWithoutMessageId, state);
    await handler(input);

    expect(updateMessageEntries).not.toHaveBeenCalled();
  });

  it('should handle database update errors gracefully', async () => {
    vi.mocked(updateMessageEntries).mockRejectedValue(new Error('Database error'));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const input: CreateMetricsInput = {
      files: [{ name: 'metric1', yml_content: 'content1' }],
    };

    const handler = createCreateMetricsFinish(mockContext, state);
    await handler({
      input,
      toolCallId: 'tool-123',
      messages: [],
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[create-metrics] Failed to finalize streaming data',
      expect.objectContaining({
        messageId: 'msg-xyz',
        error: 'Database error',
      })
    );

    consoleErrorSpy.mockRestore();
  });

  it('should handle empty files array', async () => {
    const input: CreateMetricsInput = {
      files: [],
    };

    const handler = createCreateMetricsFinish(mockContext, state);
    await handler({
      input,
      toolCallId: 'tool-123',
      messages: [],
    });

    expect(state.files).toBeDefined();
    expect(state.files!).toHaveLength(0);
  });

  it('should log file information', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const input: CreateMetricsInput = {
      files: [
        { name: 'metric1', yml_content: 'content1' },
        { name: 'metric2', yml_content: 'content2' },
      ],
    };

    const handler = createCreateMetricsFinish(mockContext, state);
    await handler({
      input,
      toolCallId: 'tool-123',
      messages: [],
    });

    expect(consoleInfoSpy).toHaveBeenCalledWith(
      '[create-metrics] Input fully available',
      expect.objectContaining({
        fileCount: 2,
        fileNames: ['metric1', 'metric2'],
        messageId: 'msg-xyz',
        timestamp: expect.any(String),
      })
    );

    expect(consoleInfoSpy).toHaveBeenCalledWith(
      '[create-metrics] Finalizing streaming data',
      expect.objectContaining({
        messageId: 'msg-xyz',
        fileCount: 2,
        toolCallId: 'tool-123',
      })
    );

    consoleInfoSpy.mockRestore();
  });

  it('should mark files as processing when status is not set', async () => {
    // Pre-populate with files that have different statuses
    state.files = [
      {
        name: 'metric1',
        yml_content: 'old content',
        status: 'failed',
        error: 'previous error',
      },
      {
        name: 'metric2',
        yml_content: 'old content',
        // No status
      },
    ];

    const input: CreateMetricsInput = {
      files: [
        { name: 'metric1', yml_content: 'new content' },
        { name: 'metric2', yml_content: 'new content' },
      ],
    };

    const handler = createCreateMetricsFinish(mockContext, state);
    await handler({
      input,
      toolCallId: 'tool-123',
      messages: [],
    });

    // All files should be marked as processing
    expect(state.files![0]?.status).toBe('failed'); // Keeps existing non-processing status
    expect(state.files![0]?.error).toBe('previous error'); // Preserves error
    expect(state.files![1]?.status).toBe('processing'); // Sets to processing if undefined
  });

  it('should handle files with existing IDs and versions', async () => {
    state.files = [
      {
        name: 'metric1',
        yml_content: '',
        id: 'id-123',
        version: 2,
      },
    ];

    const input: CreateMetricsInput = {
      files: [{ name: 'metric1', yml_content: 'final content' }],
    };

    const handler = createCreateMetricsFinish(mockContext, state);
    await handler({
      input,
      toolCallId: 'tool-123',
      messages: [],
    });

    expect(state.files![0]).toEqual({
      name: 'metric1',
      yml_content: 'final content',
      status: 'processing',
      id: 'id-123',
      version: 2,
    });
  });
});
