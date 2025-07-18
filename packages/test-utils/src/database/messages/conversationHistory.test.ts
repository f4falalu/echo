import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanupTestEnvironment, setupTestEnvironment } from '../../envHelpers/env-helpers';
import { createTestChat } from '../chats/createTestChat';
import { createTestMessage } from './createTestMessage';

vi.mock('../chats/createTestChat');
vi.mock('./createTestMessage');

describe('Conversation History Test Helpers - Unit Tests', () => {
  beforeEach(async () => {
    await setupTestEnvironment();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupTestEnvironment();
  });

  test('createTestMessage can be used for conversation history testing', async () => {
    const mockChatId = 'test-chat-id';
    const mockUserId = 'test-user-id';
    const mockMessageId = 'test-message-id';

    vi.mocked(createTestMessage).mockResolvedValue(mockMessageId);

    const conversationHistory = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
    ];

    const messageId = await createTestMessage(mockChatId, mockUserId, {
      rawLlmMessages: conversationHistory,
      requestMessage: 'Hello',
    });

    expect(messageId).toBe(mockMessageId);
    expect(createTestMessage).toHaveBeenCalledWith(mockChatId, mockUserId, {
      rawLlmMessages: conversationHistory,
      requestMessage: 'Hello',
    });
  });

  test('createTestChat can be used for conversation setup', async () => {
    const mockChatContext = {
      chatId: 'test-chat-id',
      organizationId: 'test-org-id',
      userId: 'test-user-id',
    };

    vi.mocked(createTestChat).mockResolvedValue(mockChatContext);

    const result = await createTestChat();

    expect(result).toEqual(mockChatContext);
    expect(createTestChat).toHaveBeenCalledTimes(1);
  });

  test('multiple messages can be created for conversation history', async () => {
    const mockChatContext = {
      chatId: 'test-chat-id',
      organizationId: 'test-org-id',
      userId: 'test-user-id',
    };

    vi.mocked(createTestChat).mockResolvedValue(mockChatContext);
    vi.mocked(createTestMessage)
      .mockResolvedValueOnce('message-1')
      .mockResolvedValueOnce('message-2');

    const { chatId, userId } = await createTestChat();

    const firstMessageId = await createTestMessage(chatId, userId, {
      rawLlmMessages: [{ role: 'user', content: 'First question' }],
      requestMessage: 'First question',
    });

    const secondMessageId = await createTestMessage(chatId, userId, {
      rawLlmMessages: [{ role: 'user', content: 'Follow-up question' }],
      requestMessage: 'Follow-up question',
    });

    expect(firstMessageId).toBe('message-1');
    expect(secondMessageId).toBe('message-2');
    expect(createTestMessage).toHaveBeenCalledTimes(2);
  });
});
