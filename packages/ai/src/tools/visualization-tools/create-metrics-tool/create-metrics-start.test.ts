import { updateMessageFields } from '@buster/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCreateMetricsStart } from './create-metrics-start';
import type { CreateMetricsInput, CreateMetricsState } from './create-metrics-tool';

// Mock the database module
vi.mock('@buster/database', () => ({
  updateMessageFields: vi.fn(),
}));

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
      argsText: '',
      files: [],
      messageId: mockContext.messageId,
    };
  });

  it('should initialize state when input is provided', async () => {
    const input: CreateMetricsInput = {
      files: [
        { name: 'metric1', yml_content: 'content1' },
        { name: 'metric2', yml_content: 'content2' },
      ],
    };

    const handler = createCreateMetricsStart(mockContext, state);
    await handler(input);

    // Check state was initialized
    expect(state.processingStartTime).toBeDefined();
    expect(state.toolCallId).toBeDefined();
    expect(state.toolCallId).toMatch(/^create-metrics-\d+-/);
    expect(state.files).toHaveLength(2);
    expect(state.files[0]).toEqual({
      name: 'metric1',
      yml_content: 'content1',
      status: 'processing',
    });
  });

  it('should create database entries when messageId exists', async () => {
    const input: CreateMetricsInput = {
      files: [{ name: 'metric1', yml_content: 'content1' }],
    };

    const handler = createCreateMetricsStart(mockContext, state);
    await handler(input);

    // Check database was updated
    expect(updateMessageFields).toHaveBeenCalledTimes(1);
    expect(updateMessageFields).toHaveBeenCalledWith(
      'msg-xyz',
      expect.objectContaining({
        rawLlmMessages: expect.any(Array),
        reasoning: expect.any(Array),
      })
    );

    // Check reasoning entry was created
    expect(state.reasoningEntryId).toBeDefined();
  });

  it('should handle context without messageId', async () => {
    const contextWithoutMessageId = {
      ...mockContext,
      messageId: undefined,
    };
    const stateWithoutMessageId: CreateMetricsState = {
      argsText: '',
      files: [],
      messageId: undefined,
    };

    const input: CreateMetricsInput = {
      files: [{ name: 'metric1', yml_content: 'content1' }],
    };

    const handler = createCreateMetricsStart(contextWithoutMessageId, stateWithoutMessageId);
    await handler(input);

    // Should not update database
    expect(updateMessageFields).not.toHaveBeenCalled();
    expect(stateWithoutMessageId.reasoningEntryId).toBeUndefined();

    // But should still initialize state
    expect(stateWithoutMessageId.files).toHaveLength(1);
    expect(stateWithoutMessageId.toolCallId).toBeDefined();
  });

  it('should handle database update errors gracefully', async () => {
    const error = new Error('Database error');
    vi.mocked(updateMessageFields).mockRejectedValue(error);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const input: CreateMetricsInput = {
      files: [{ name: 'metric1', yml_content: 'content1' }],
    };

    const handler = createCreateMetricsStart(mockContext, state);
    await handler(input);

    // Should log error but not throw
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[create-metrics] Failed to create initial database entries',
      expect.objectContaining({
        messageId: 'msg-xyz',
        error: 'Database error',
      })
    );

    // State should still be initialized
    expect(state.files).toHaveLength(1);

    consoleErrorSpy.mockRestore();
  });

  it('should handle empty files array', async () => {
    const input: CreateMetricsInput = {
      files: [],
    };

    const handler = createCreateMetricsStart(mockContext, state);
    await handler(input);

    expect(state.files).toHaveLength(0);
    expect(state.toolCallId).toBeDefined();
  });

  it('should log start information', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    const input: CreateMetricsInput = {
      files: [
        { name: 'metric1', yml_content: 'content1' },
        { name: 'metric2', yml_content: 'content2' },
      ],
    };

    const handler = createCreateMetricsStart(mockContext, state);
    await handler(input);

    expect(consoleInfoSpy).toHaveBeenCalledWith(
      '[create-metrics] Starting metric creation',
      expect.objectContaining({
        fileCount: 2,
        messageId: 'msg-xyz',
        timestamp: expect.any(String),
      })
    );

    consoleInfoSpy.mockRestore();
  });
});
