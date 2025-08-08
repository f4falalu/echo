import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createCreateMetricsStart } from './create-metrics-start';
import type { CreateMetricsState } from './create-metrics-tool';

// Mock the database module
vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn(),
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
      argsText: undefined,
      files: undefined,
      parsedArgs: undefined,
      toolCallId: undefined,
    };
  });

  it('should initialize state when input is provided', async () => {
    const options: ToolCallOptions = {
      toolCallId: 'tool-123',
    };

    const handler = createCreateMetricsStart(mockContext, state);
    await handler(options);

    // Check state was initialized
    expect(state.toolCallId).toBe('tool-123');
  });

  it('should create database entries when messageId is present', async () => {
    const options: ToolCallOptions = {
      toolCallId: 'tool-456',
    };

    const handler = createCreateMetricsStart(mockContext, state);
    await handler(options);

    // Check database was updated
    expect(updateMessageEntries).toHaveBeenCalledTimes(1);
    expect(updateMessageEntries).toHaveBeenCalledWith(
      expect.objectContaining({
        messageId: 'msg-xyz',
        responseEntry: expect.any(Object),
        mode: 'append',
      })
    );

    // Check state was updated
    expect(state.toolCallId).toBe('tool-456');
  });

  it('should work without messageId', async () => {
    const contextWithoutMessageId = { ...mockContext, messageId: undefined };

    const options: ToolCallOptions = {
      toolCallId: 'tool-789',
    };

    const handler = createCreateMetricsStart(contextWithoutMessageId, state);
    await handler(options);

    // Should not call database
    expect(updateMessageEntries).not.toHaveBeenCalled();
    expect(state.toolCallId).toBe('tool-789');
  });

  it('should handle database update errors gracefully', async () => {
    vi.mocked(updateMessageEntries).mockRejectedValue(new Error('Database error'));

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const options: ToolCallOptions = {
      toolCallId: 'tool-error',
    };

    const handler = createCreateMetricsStart(mockContext, state);
    await handler(options);

    // Should log error but not throw
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[create-metrics] Error creating initial database entries:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should handle empty files array', async () => {
    const options: ToolCallOptions = {
      toolCallId: 'tool-empty',
    };

    const handler = createCreateMetricsStart(mockContext, state);
    await handler(options);

    expect(state.toolCallId).toBe('tool-empty');
  });

  it('should not throw on any input', async () => {
    const options: ToolCallOptions = {
      toolCallId: 'tool-test',
    };

    const handler = createCreateMetricsStart(mockContext, state);

    // Should not throw
    await expect(handler(options)).resolves.not.toThrow();
  });
});
