import { updateMessageEntries } from '@buster/database/queries';
import type { ToolCallOptions } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCreateMetricsStart } from './create-metrics-start';
import type { CreateMetricsState } from './create-metrics-tool';

// Mock the database module
vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn(),
}));

// Mock the transform helper
vi.mock('./helpers/create-metrics-transform-helper', () => ({
  createCreateMetricsReasoningEntry: vi.fn(() => undefined), // Initially returns undefined
  createCreateMetricsRawLlmMessageEntry: vi.fn(() => undefined), // Initially returns undefined
}));

import * as transformHelper from './helpers/create-metrics-transform-helper';

describe('createCreateMetricsStart', () => {
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
      toolCallId: undefined,
    };
  });

  it('should initialize state when input is provided', async () => {
    const options: ToolCallOptions = {
      toolCallId: 'tool-123',
      messages: [],
    };

    const handler = createCreateMetricsStart(mockContext, state);
    await handler(options);

    // Check state was initialized
    expect(state.toolCallId).toBe('tool-123');
  });

  it('should create database entries when messageId is present', async () => {
    // Mock transform helpers to return valid entries
    vi.mocked(transformHelper.createCreateMetricsReasoningEntry).mockReturnValue({
      id: 'tool-456',
      type: 'files',
      title: 'Creating metrics...',
      status: 'loading',
      file_ids: [],
      files: {},
    });

    vi.mocked(transformHelper.createCreateMetricsRawLlmMessageEntry).mockReturnValue({
      role: 'assistant',
      content: [
        {
          type: 'tool-call',
          toolCallId: 'tool-456',
          toolName: 'createMetrics',
          input: { files: [] },
        },
      ],
    });

    const options: ToolCallOptions = {
      toolCallId: 'tool-456',
      messages: [],
    };

    const handler = createCreateMetricsStart(mockContext, state);
    await handler(options);

    // Check database was updated
    expect(updateMessageEntries).toHaveBeenCalledTimes(1);
    expect(updateMessageEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: 'msg-xyz',
        reasoningMessages: [expect.any(Object)],
        rawLlmMessages: [expect.any(Object)],
      })
    );

    // Check state was updated
    expect(state.toolCallId).toBe('tool-456');
  });

  it('should work without messageId', async () => {
    const contextWithoutMessageId = { ...mockContext, messageId: undefined };

    const options: ToolCallOptions = {
      toolCallId: 'tool-789',
      messages: [],
    };

    const handler = createCreateMetricsStart(contextWithoutMessageId, state);
    await handler(options);

    // Should not call database
    expect(updateMessageEntries).not.toHaveBeenCalled();
    expect(state.toolCallId).toBe('tool-789');
  });

  it('should handle database update errors gracefully', async () => {
    // Mock transform helpers to return valid entries
    vi.mocked(transformHelper.createCreateMetricsReasoningEntry).mockReturnValue({
      id: 'tool-error',
      type: 'files',
      title: 'Creating metrics...',
      status: 'loading',
      file_ids: [],
      files: {},
    });

    vi.mocked(updateMessageEntries).mockRejectedValue(new Error('Database error'));

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const options: ToolCallOptions = {
      toolCallId: 'tool-error',
      messages: [],
    };

    const handler = createCreateMetricsStart(mockContext, state);
    await handler(options);

    // Should log error but not throw
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[create-metrics] Error updating entries on finish:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should handle empty files array', async () => {
    const options: ToolCallOptions = {
      toolCallId: 'tool-empty',
      messages: [],
    };

    const handler = createCreateMetricsStart(mockContext, state);
    await handler(options);

    expect(state.toolCallId).toBe('tool-empty');
  });

  it('should not throw on any input', async () => {
    const options: ToolCallOptions = {
      toolCallId: 'tool-test',
      messages: [],
    };

    const handler = createCreateMetricsStart(mockContext, state);

    // Should not throw
    await expect(handler(options)).resolves.not.toThrow();
  });

  it('should not update database when no entries are returned', async () => {
    // Explicitly mock transform helpers to return undefined
    vi.mocked(transformHelper.createCreateMetricsReasoningEntry).mockReturnValue(undefined);
    vi.mocked(transformHelper.createCreateMetricsRawLlmMessageEntry).mockReturnValue(undefined);

    const options: ToolCallOptions = {
      toolCallId: 'tool-no-entries',
      messages: [],
    };

    const handler = createCreateMetricsStart(mockContext, state);
    await handler(options);

    // Should not call database when both entries are undefined
    expect(updateMessageEntries).not.toHaveBeenCalled();
    expect(state.toolCallId).toBe('tool-no-entries');
  });
});
