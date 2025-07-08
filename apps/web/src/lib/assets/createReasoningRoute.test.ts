import { describe, it, expect, vi } from 'vitest';
import { createReasoningRoute } from './createReasoningRoute';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';

// Mock the dependencies
vi.mock('@/routes/busterRoutes', () => ({
  BusterRoutes: {
    APP_CHAT_ID_REASONING_ID: '/app/chats/:chatId/reasoning/:messageId'
  },
  createBusterRoute: vi.fn()
}));

describe('createReasoningRoute', () => {
  const mockCreateBusterRoute = vi.mocked(createBusterRoute);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty string when chatId is undefined', () => {
    const assetId = 'test-message-123';
    const chatId = undefined;

    const result = createReasoningRoute({ assetId, chatId });

    expect(result).toBe('');
    expect(mockCreateBusterRoute).not.toHaveBeenCalled();
  });

  it('should return empty string when chatId is null', () => {
    const assetId = 'test-message-123';
    const chatId = null as any;

    const result = createReasoningRoute({ assetId, chatId });

    expect(result).toBe('');
    expect(mockCreateBusterRoute).not.toHaveBeenCalled();
  });

  it('should return empty string when chatId is empty string', () => {
    const assetId = 'test-message-123';
    const chatId = '';

    const result = createReasoningRoute({ assetId, chatId });

    expect(result).toBe('');
    expect(mockCreateBusterRoute).not.toHaveBeenCalled();
  });

  it('should call createBusterRoute with correct parameters when both assetId and chatId are provided', () => {
    const assetId = 'test-message-123';
    const chatId = 'test-chat-456';
    const expectedRoute = '/app/chats/test-chat-456/reasoning/test-message-123';

    mockCreateBusterRoute.mockReturnValue(expectedRoute);

    const result = createReasoningRoute({ assetId, chatId });

    expect(mockCreateBusterRoute).toHaveBeenCalledWith({
      route: BusterRoutes.APP_CHAT_ID_REASONING_ID,
      chatId,
      messageId: assetId
    });
    expect(result).toBe(expectedRoute);
  });

  it('should handle assetId with special characters', () => {
    const assetId = 'message-with-special-chars-123!@#';
    const chatId = 'test-chat-456';
    const expectedRoute = '/app/chats/test-chat-456/reasoning/message-with-special-chars-123!@#';

    mockCreateBusterRoute.mockReturnValue(expectedRoute);

    const result = createReasoningRoute({ assetId, chatId });

    expect(mockCreateBusterRoute).toHaveBeenCalledWith({
      route: BusterRoutes.APP_CHAT_ID_REASONING_ID,
      chatId,
      messageId: assetId
    });
    expect(result).toBe(expectedRoute);
  });

  it('should handle empty assetId', () => {
    const assetId = '';
    const chatId = 'test-chat-456';
    const expectedRoute = '/app/chats/test-chat-456/reasoning/';

    mockCreateBusterRoute.mockReturnValue(expectedRoute);

    const result = createReasoningRoute({ assetId, chatId });

    expect(mockCreateBusterRoute).toHaveBeenCalledWith({
      route: BusterRoutes.APP_CHAT_ID_REASONING_ID,
      chatId,
      messageId: assetId
    });
    expect(result).toBe(expectedRoute);
  });

  it('should handle chatId with special characters', () => {
    const assetId = 'test-message-123';
    const chatId = 'chat-with-special-chars-456!@#';
    const expectedRoute = '/app/chats/chat-with-special-chars-456!@#/reasoning/test-message-123';

    mockCreateBusterRoute.mockReturnValue(expectedRoute);

    const result = createReasoningRoute({ assetId, chatId });

    expect(mockCreateBusterRoute).toHaveBeenCalledWith({
      route: BusterRoutes.APP_CHAT_ID_REASONING_ID,
      chatId,
      messageId: assetId
    });
    expect(result).toBe(expectedRoute);
  });

  it('should verify that assetId is correctly mapped to messageId parameter', () => {
    const assetId = 'test-message-123';
    const chatId = 'test-chat-456';

    createReasoningRoute({ assetId, chatId });

    // Verify that createBusterRoute is called with messageId (not assetId)
    expect(mockCreateBusterRoute).toHaveBeenCalledWith({
      route: BusterRoutes.APP_CHAT_ID_REASONING_ID,
      chatId,
      messageId: assetId
    });

    // Verify that assetId is not passed directly
    const callArgs = mockCreateBusterRoute.mock.calls[0][0];
    expect(callArgs).not.toHaveProperty('assetId');
    expect(callArgs).toHaveProperty('messageId', assetId);
  });

  it('should handle zero as chatId (edge case)', () => {
    const assetId = 'test-message-123';
    const chatId = '0';

    const expectedRoute = '/app/chats/0/reasoning/test-message-123';
    mockCreateBusterRoute.mockReturnValue(expectedRoute);

    const result = createReasoningRoute({ assetId, chatId });

    expect(mockCreateBusterRoute).toHaveBeenCalledWith({
      route: BusterRoutes.APP_CHAT_ID_REASONING_ID,
      chatId,
      messageId: assetId
    });
    expect(result).toBe(expectedRoute);
  });
});
