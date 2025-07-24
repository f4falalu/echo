import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the database connection and database functions BEFORE any other imports
vi.mock('@buster/database/connection', () => ({
  initializePool: vi.fn(),
  getPool: vi.fn(),
}));
vi.mock('@buster/database', () => ({
  createMessage: vi.fn(),
  db: {
    transaction: vi.fn((callback: any) => callback({ insert: vi.fn() })),
  },
  getChatWithDetails: vi.fn(),
  getMessagesForChat: vi.fn(),
  chats: {},
  messages: {},
}));

// Mock the access-controls package
vi.mock('@buster/access-controls', () => ({
  canUserAccessChatCached: vi.fn(),
}));

import { canUserAccessChatCached } from '@buster/access-controls';
import * as database from '@buster/database';
import type { Chat, Message } from '@buster/database';
import { ChatError, ChatErrorCode } from '@buster/server-shared/chats';
import { buildChatWithMessages, handleExistingChat, handleNewChat } from './chat-helpers';

const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Test User',
  email: 'test@example.com',
  avatarUrl: null,
};

const mockChat = {
  id: 'chat-123',
  title: 'Test Chat',
  organizationId: '550e8400-e29b-41d4-a716-446655440000',
  createdBy: '550e8400-e29b-41d4-a716-446655440001',
  updatedBy: '550e8400-e29b-41d4-a716-446655440001',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  publiclyAccessible: false,
  deletedAt: null,
  publiclyEnabledBy: null,
  publicExpiryDate: null,
  mostRecentFileId: null,
  mostRecentFileType: null,
  mostRecentVersionNumber: null,
  slackChatAuthorization: null,
  slackThreadTs: null,
  slackChannelId: null,
  workspaceSharingEnabledBy: null,
  workspaceSharingEnabledAt: null,
} as Chat;

const mockMessage: Message = {
  id: 'msg-123',
  chatId: 'chat-123',
  createdBy: 'user-123',
  requestMessage: 'Test message',
  responseMessages: {},
  reasoning: {},
  title: 'Test message',
  rawLlmMessages: {},
  finalReasoningMessage: null,
  isCompleted: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  deletedAt: null,
  feedback: null,
  postProcessingMessage: null,
  triggerRunId: null,
};

describe('buildChatWithMessages', () => {
  it('should build a ChatWithMessages object from database entities', () => {
    const result = buildChatWithMessages(mockChat, [mockMessage], mockUser, true);
    expect(result).toMatchObject({
      id: 'chat-123',
      title: 'Test Chat',
      is_favorited: true,
      message_ids: ['msg-123'],
      messages: {
        'msg-123': {
          id: 'msg-123',
          created_at: expect.any(String),
          updated_at: expect.any(String),
          request_message: {
            request: 'Test message',
            sender_id: 'user-123',
            sender_name: 'Test User',
          },
          response_messages: {},
          response_message_ids: [],
          reasoning_message_ids: [],
          reasoning_messages: {},
          final_reasoning_message: null,
          feedback: null,
          is_completed: false,
        },
      },
      created_at: expect.any(String),
      updated_at: expect.any(String),
      created_by: '550e8400-e29b-41d4-a716-446655440001',
      created_by_id: '550e8400-e29b-41d4-a716-446655440001',
      created_by_name: 'Test User',
      created_by_avatar: null,
      publicly_accessible: false,
      permission: 'owner',
    });
  });

  it('should handle missing creator details', () => {
    const result = buildChatWithMessages(mockChat, [], null, false);

    expect(result.created_by_name).toBe('Unknown User');
    expect(result.created_by_avatar).toBeNull();
  });
});

describe('handleExistingChat', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    avatarUrl: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle existing chat with new message', async () => {
    const mockChat = {
      id: 'chat-1',
      title: 'Test Chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'user-1',
      updatedBy: 'user-1',
      organizationId: 'org-1',
      publiclyAccessible: false,
      deletedAt: null,
      publiclyEnabledBy: null,
      publicExpiryDate: null,
      mostRecentFileId: null,
      mostRecentFileType: null,
    } as Chat;

    const mockMessage = {
      id: 'message-1',
      chatId: 'chat-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'user-1',
      requestMessage: 'Test message',
      responseMessages: {},
      reasoning: {},
      title: 'Test message',
      rawLlmMessages: {},
      isCompleted: false,
      deletedAt: null,
      finalReasoningMessage: null,
      feedback: null,
    } as Message;

    vi.mocked(database.getChatWithDetails).mockResolvedValue({
      chat: mockChat,
      user: mockUser as unknown as any,
      isFavorited: false,
    });

    vi.mocked(canUserAccessChatCached).mockResolvedValue(true);
    vi.mocked(database.createMessage).mockResolvedValue(mockMessage);
    vi.mocked(database.getMessagesForChat).mockResolvedValue([mockMessage]);

    const result = await handleExistingChat('chat-1', 'message-1', 'Test message', mockUser);

    expect(result.chatId).toBe('chat-1');
    expect(result.messageId).toBe('message-1');
    expect(result.chat.messages['message-1']).toBeDefined();
  });

  it('should throw error if chat not found', async () => {
    vi.mocked(database.getChatWithDetails).mockResolvedValue(null);

    await expect(
      handleExistingChat('chat-1', 'message-1', 'Test message', mockUser)
    ).rejects.toThrow(new ChatError(ChatErrorCode.CHAT_NOT_FOUND, 'Chat not found', 404));
  });

  it('should throw error if permission denied', async () => {
    vi.mocked(database.getChatWithDetails).mockResolvedValue({
      chat: { id: 'chat-1' } as Chat,
      user: null,
      isFavorited: false,
    });
    vi.mocked(canUserAccessChatCached).mockResolvedValue(false);

    await expect(
      handleExistingChat('chat-1', 'message-1', 'Test message', mockUser)
    ).rejects.toThrow(
      new ChatError(
        ChatErrorCode.PERMISSION_DENIED,
        'You do not have permission to access this chat',
        403
      )
    );
  });

  it('should prepend new message to maintain descending order (newest first)', async () => {
    const baseTime = new Date('2024-01-01T10:00:00Z');
    
    const mockChat = {
      id: 'chat-1',
      title: 'Test Chat',
      createdAt: baseTime.toISOString(),
      updatedAt: baseTime.toISOString(),
      createdBy: 'user-1',
      updatedBy: 'user-1',
      organizationId: 'org-1',
      publiclyAccessible: false,
      deletedAt: null,
      publiclyEnabledBy: null,
      publicExpiryDate: null,
      mostRecentFileId: null,
      mostRecentFileType: null,
    } as Chat;

    const existingMessage1 = {
      id: 'message-1',
      chatId: 'chat-1',
      createdAt: new Date(baseTime.getTime() + 2000).toISOString(), // 2 seconds later
      updatedAt: new Date(baseTime.getTime() + 2000).toISOString(),
      createdBy: 'user-1',
      requestMessage: 'Second message',
      responseMessages: {},
      reasoning: {},
      title: 'Second message',
      rawLlmMessages: {},
      isCompleted: false,
      deletedAt: null,
      finalReasoningMessage: null,
      feedback: null,
    } as Message;

    const existingMessage2 = {
      id: 'message-2',
      chatId: 'chat-1',
      createdAt: baseTime.toISOString(), // Original time
      updatedAt: baseTime.toISOString(),
      createdBy: 'user-1',
      requestMessage: 'First message',
      responseMessages: {},
      reasoning: {},
      title: 'First message',
      rawLlmMessages: {},
      isCompleted: false,
      deletedAt: null,
      finalReasoningMessage: null,
      feedback: null,
    } as Message;

    const newMessage = {
      id: 'message-3',
      chatId: 'chat-1',
      createdAt: new Date(baseTime.getTime() + 4000).toISOString(), // 4 seconds later (newest)
      updatedAt: new Date(baseTime.getTime() + 4000).toISOString(),
      createdBy: 'user-1',
      requestMessage: 'Third message (newest)',
      responseMessages: {},
      reasoning: {},
      title: 'Third message (newest)',
      rawLlmMessages: {},
      isCompleted: false,
      deletedAt: null,
      finalReasoningMessage: null,
      feedback: null,
    } as Message;

    vi.mocked(database.getChatWithDetails).mockResolvedValue({
      chat: mockChat,
      user: mockUser as unknown as any,
      isFavorited: false,
    });

    vi.mocked(canUserAccessChatCached).mockResolvedValue(true);
    vi.mocked(database.createMessage).mockResolvedValue(newMessage);
    // getMessagesForChat returns existing messages in descending order (newest first)
    vi.mocked(database.getMessagesForChat).mockResolvedValue([existingMessage1, existingMessage2]);

    const result = await handleExistingChat('chat-1', 'message-3', 'Third message (newest)', mockUser);

    expect(result.chat.messages['message-3']).toBeDefined();
    expect(result.chat.messages['message-1']).toBeDefined();
    expect(result.chat.messages['message-2']).toBeDefined();

    expect(result.chat.message_ids).toEqual(['message-3', 'message-1', 'message-2']);
    
    expect(result.chat.message_ids[0]).toBe('message-3');
    
    const message3 = result.chat.messages['message-3'];
    const message1 = result.chat.messages['message-1'];
    const message2 = result.chat.messages['message-2'];
    
    expect(message3).toBeDefined();
    expect(message1).toBeDefined();
    expect(message2).toBeDefined();
    
    const message3Time = new Date(message3!.created_at).getTime();
    const message1Time = new Date(message1!.created_at).getTime();
    const message2Time = new Date(message2!.created_at).getTime();
    
    expect(message3Time).toBeGreaterThan(message1Time);
    expect(message1Time).toBeGreaterThan(message2Time);
  });

  it('should handle single existing message with new message correctly', async () => {
    const baseTime = new Date('2024-01-01T10:00:00Z');
    
    const mockChat = {
      id: 'chat-1',
      title: 'Test Chat',
      createdAt: baseTime.toISOString(),
      updatedAt: baseTime.toISOString(),
      createdBy: 'user-1',
      updatedBy: 'user-1',
      organizationId: 'org-1',
      publiclyAccessible: false,
      deletedAt: null,
      publiclyEnabledBy: null,
      publicExpiryDate: null,
      mostRecentFileId: null,
      mostRecentFileType: null,
    } as Chat;

    const existingMessage = {
      id: 'message-1',
      chatId: 'chat-1',
      createdAt: baseTime.toISOString(),
      updatedAt: baseTime.toISOString(),
      createdBy: 'user-1',
      requestMessage: 'First message',
      responseMessages: {},
      reasoning: {},
      title: 'First message',
      rawLlmMessages: {},
      isCompleted: false,
      deletedAt: null,
      finalReasoningMessage: null,
      feedback: null,
    } as Message;

    const newMessage = {
      id: 'message-2',
      chatId: 'chat-1',
      createdAt: new Date(baseTime.getTime() + 1000).toISOString(), // 1 second later
      updatedAt: new Date(baseTime.getTime() + 1000).toISOString(),
      createdBy: 'user-1',
      requestMessage: 'Second message',
      responseMessages: {},
      reasoning: {},
      title: 'Second message',
      rawLlmMessages: {},
      isCompleted: false,
      deletedAt: null,
      finalReasoningMessage: null,
      feedback: null,
    } as Message;

    vi.mocked(database.getChatWithDetails).mockResolvedValue({
      chat: mockChat,
      user: mockUser as unknown as any,
      isFavorited: false,
    });

    vi.mocked(canUserAccessChatCached).mockResolvedValue(true);
    vi.mocked(database.createMessage).mockResolvedValue(newMessage);
    vi.mocked(database.getMessagesForChat).mockResolvedValue([existingMessage]);

    const result = await handleExistingChat('chat-1', 'message-2', 'Second message', mockUser);

    expect(result.chat.messages['message-1']).toBeDefined();
    expect(result.chat.messages['message-2']).toBeDefined();

    expect(result.chat.message_ids).toEqual(['message-2', 'message-1']);
    
    expect(result.chat.message_ids[0]).toBe('message-2');
  });

  it('should handle empty existing messages with new message', async () => {
    const baseTime = new Date('2024-01-01T10:00:00Z');
    
    const mockChat = {
      id: 'chat-1',
      title: 'Test Chat',
      createdAt: baseTime.toISOString(),
      updatedAt: baseTime.toISOString(),
      createdBy: 'user-1',
      updatedBy: 'user-1',
      organizationId: 'org-1',
      publiclyAccessible: false,
      deletedAt: null,
      publiclyEnabledBy: null,
      publicExpiryDate: null,
      mostRecentFileId: null,
      mostRecentFileType: null,
    } as Chat;

    const newMessage = {
      id: 'message-1',
      chatId: 'chat-1',
      createdAt: baseTime.toISOString(),
      updatedAt: baseTime.toISOString(),
      createdBy: 'user-1',
      requestMessage: 'First message',
      responseMessages: {},
      reasoning: {},
      title: 'First message',
      rawLlmMessages: {},
      isCompleted: false,
      deletedAt: null,
      finalReasoningMessage: null,
      feedback: null,
    } as Message;

    vi.mocked(database.getChatWithDetails).mockResolvedValue({
      chat: mockChat,
      user: mockUser as unknown as any,
      isFavorited: false,
    });

    vi.mocked(canUserAccessChatCached).mockResolvedValue(true);
    vi.mocked(database.createMessage).mockResolvedValue(newMessage);
    vi.mocked(database.getMessagesForChat).mockResolvedValue([]); // No existing messages

    const result = await handleExistingChat('chat-1', 'message-1', 'First message', mockUser);

    expect(result.chat.messages['message-1']).toBeDefined();
    expect(Object.keys(result.chat.messages)).toHaveLength(1);

    expect(result.chat.message_ids).toEqual(['message-1']);
  });
});

describe('handleNewChat', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    avatarUrl: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create new chat with message', async () => {
    const mockChat = {
      id: 'chat-1',
      title: 'Test Chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'user-1',
      updatedBy: 'user-1',
      organizationId: 'org-1',
      publiclyAccessible: false,
      deletedAt: null,
      publiclyEnabledBy: null,
      publicExpiryDate: null,
      mostRecentFileId: null,
      mostRecentFileType: null,
    } as Chat;

    const mockTx = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([mockChat]),
    };

    vi.mocked(database.db.transaction).mockImplementation((callback: any) => callback(mockTx));

    const result = await handleNewChat({
      title: 'Test Chat',
      messageId: 'message-1',
      prompt: 'Test message',
      user: mockUser,
      organizationId: 'org-1',
    });

    expect(result.chatId).toBe('chat-1');
    expect(result.messageId).toBe('message-1');
  });

  it('should create new chat without message', async () => {
    const mockChat = {
      id: 'chat-1',
      title: 'Test Chat',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'user-1',
      updatedBy: 'user-1',
      organizationId: 'org-1',
      publiclyAccessible: false,
      deletedAt: null,
      publiclyEnabledBy: null,
      publicExpiryDate: null,
      mostRecentFileId: null,
      mostRecentFileType: null,
    } as Chat;

    const mockTx = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([mockChat]),
    };

    vi.mocked(database.db.transaction).mockImplementation((callback: any) => callback(mockTx));

    const result = await handleNewChat({
      title: 'Test Chat',
      messageId: 'message-1',
      prompt: undefined,
      user: mockUser,
      organizationId: 'org-1',
    });

    expect(result.chatId).toBe('chat-1');
    expect(result.messageId).toBe('message-1');
    expect(Object.keys(result.chat.messages)).toHaveLength(0);
  });
});
