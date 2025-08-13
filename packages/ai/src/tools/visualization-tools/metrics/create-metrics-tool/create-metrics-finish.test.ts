import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCreateMetricsFinish } from './create-metrics-finish';
import type { CreateMetricsInput, CreateMetricsState } from './create-metrics-tool';

// Mock the database module
vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn(),
}));

// Mock the transform helper
vi.mock('./helpers/create-metrics-transform-helper', () => ({
  createCreateMetricsReasoningEntry: vi.fn(() => ({
    id: 'tool-123',
    type: 'files',
    title: 'Creating metrics...',
    status: 'loading',
    file_ids: ['file-1'],
    files: {},
  })),
  createCreateMetricsRawLlmMessageEntry: vi.fn(() => ({
    role: 'assistant',
    content: [
      {
        type: 'tool-call',
        toolCallId: 'tool-123',
        toolName: 'createMetrics',
        input: { files: [] },
      },
    ],
  })),
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

    expect(state.files).toBeDefined();
    expect(state.files!).toHaveLength(2);
    expect(state.files![0]).toMatchObject({
      file_name: 'metric1',
      file_type: 'metric',
      file: {
        text: 'content1',
      },
      status: 'loading',
    });
    expect(state.files![1]).toMatchObject({
      file_name: 'metric2',
      file_type: 'metric',
      file: {
        text: 'content2',
      },
      status: 'loading',
    });
  });

  it('should merge with existing state files', async () => {
    // Pre-populate state with existing file data
    state.files = [
      {
        id: 'existing-id-1',
        file_name: 'metric1',
        file_type: 'metric',
        version_number: 2,
        file: {
          text: '',
        },
        status: 'loading',
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
    expect(state.files![0]).toMatchObject({
      id: 'existing-id-1',
      file_name: 'metric1',
      file_type: 'metric',
      version_number: 2,
      file: {
        text: 'updated content',
      },
      status: 'loading',
    });
    expect(state.files![1]).toMatchObject({
      file_name: 'metric2',
      file_type: 'metric',
      version_number: 1,
      file: {
        text: 'content2',
      },
      status: 'loading',
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
        toolCallId: 'tool-123',
      })
    );
  });

  it('should not update database when messageId is missing', async () => {
    const contextWithoutMessageId = { ...mockContext, messageId: undefined };

    const input: CreateMetricsInput = {
      files: [{ name: 'metric1', yml_content: 'content1' }],
    };

    const handler = createCreateMetricsFinish(contextWithoutMessageId, state);
    await handler({
      input,
      toolCallId: 'tool-123',
      messages: [],
    });

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
      '[create-metrics] Error updating entries on finish:',
      expect.any(Error)
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

  it('should preserve existing status when not loading', async () => {
    // Pre-populate with files that have different statuses
    state.files = [
      {
        id: 'id-1',
        file_name: 'metric1',
        file_type: 'metric',
        version_number: 1,
        file: {
          text: 'old content',
        },
        status: 'failed',
      },
      {
        id: 'id-2',
        file_name: 'metric2',
        file_type: 'metric',
        version_number: 1,
        file: {
          text: 'old content',
        },
        status: 'completed',
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

    // Status should be preserved
    expect(state.files![0]?.status).toBe('failed');
    expect(state.files![1]?.status).toBe('completed');
  });

  it('should handle files with existing IDs and versions', async () => {
    state.files = [
      {
        id: 'id-123',
        file_name: 'metric1',
        file_type: 'metric',
        version_number: 2,
        file: {
          text: '',
        },
        status: 'loading',
      },
      {
        id: 'id-456',
        file_name: 'metric2',
        file_type: 'metric',
        version_number: 3,
        file: {
          text: '',
        },
        status: 'loading',
      },
    ];

    const input: CreateMetricsInput = {
      files: [
        { name: 'metric1', yml_content: 'final content' },
        { name: 'metric2', yml_content: 'content2' },
      ],
    };

    const handler = createCreateMetricsFinish(mockContext, state);
    await handler({
      input,
      toolCallId: 'tool-123',
      messages: [],
    });

    expect(state.files![0]).toEqual({
      file_name: 'metric1',
      file: { text: 'final content' },
      id: 'id-123',
      file_type: 'metric',
      version_number: 2,
      status: 'loading',
    });

    expect(state.files![1]).toEqual({
      file_name: 'metric2',
      file: { text: 'content2' },
      id: 'id-456',
      file_type: 'metric',
      version_number: 3,
      status: 'loading',
    });
  });
});
