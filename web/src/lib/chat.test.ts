import { updateChatToIChat } from './chat';
import type { BusterChat, BusterChatMessage } from '@/api/asset_interfaces/chat';

describe('updateChatToIChat', () => {
  test('should correctly upgrade a chat with no messages', () => {
    const mockChat: BusterChat = {
      id: '123',
      title: 'Test Chat',
      is_favorited: false,
      message_ids: [],
      messages: {},
      created_at: '2024-03-20T12:00:00Z',
      updated_at: '2024-03-20T12:00:00Z',
      created_by: 'test-user',
      created_by_id: 'user123',
      created_by_name: 'Test User',
      created_by_avatar: null
    };

    const { iChat, iChatMessages } = updateChatToIChat(mockChat, false);

    expect(iChat).toEqual({
      id: '123',
      title: 'Test Chat',
      is_favorited: false,
      message_ids: [],
      created_at: '2024-03-20T12:00:00Z',
      updated_at: '2024-03-20T12:00:00Z',
      created_by: 'test-user',
      created_by_id: 'user123',
      created_by_name: 'Test User',
      created_by_avatar: null,
      isNewChat: false
    });
    expect(iChatMessages).toEqual({});
  });

  test('should correctly upgrade a chat with existing messages when not new', () => {
    const mockChat: BusterChat = {
      id: '123',
      title: 'Test Chat',
      is_favorited: false,
      message_ids: ['msg1', 'msg2'],
      messages: {
        msg1: {
          id: 'msg1',
          request_message: {
            request: 'Hello',
            sender_id: 'user123',
            sender_name: 'Test User',
            sender_avatar: null
          },
          response_message_ids: [],
          response_messages: {},
          reasoning_message_ids: [],
          reasoning_messages: {},
          created_at: '2024-03-20T12:00:00Z',
          final_reasoning_message: null,
          feedback: null
        },
        msg2: {
          id: 'msg2',
          request_message: {
            request: 'World',
            sender_id: 'user123',
            sender_name: 'Test User',
            sender_avatar: null
          },
          response_message_ids: [],
          response_messages: {},
          reasoning_message_ids: [],
          reasoning_messages: {},
          created_at: '2024-03-20T12:01:00Z',
          final_reasoning_message: null,
          feedback: null
        }
      },
      created_at: '2024-03-20T12:00:00Z',
      updated_at: '2024-03-20T12:01:00Z',
      created_by: 'test-user',
      created_by_id: 'user123',
      created_by_name: 'Test User',
      created_by_avatar: null
    };

    const { iChat, iChatMessages } = updateChatToIChat(mockChat, false);

    expect(iChat.isNewChat).toBe(false);
    expect(Object.keys(iChatMessages)).toHaveLength(2);
    expect(iChatMessages.msg1.isCompletedStream).toBe(true);
    expect(iChatMessages.msg2.isCompletedStream).toBe(true);
  });

  test('should mark the last message as incomplete stream when isNewChat is true', () => {
    const mockChat: BusterChat = {
      id: '123',
      title: 'Test Chat',
      is_favorited: false,
      message_ids: ['msg1', 'msg2'],
      messages: {
        msg1: {
          id: 'msg1',
          request_message: {
            request: 'Hello',
            sender_id: 'user123',
            sender_name: 'Test User',
            sender_avatar: null
          },
          response_message_ids: [],
          response_messages: {},
          reasoning_message_ids: [],
          reasoning_messages: {},
          created_at: '2024-03-20T12:00:00Z',
          final_reasoning_message: null,
          feedback: null
        },
        msg2: {
          id: 'msg2',
          request_message: {
            request: 'World',
            sender_id: 'user123',
            sender_name: 'Test User',
            sender_avatar: null
          },
          response_message_ids: [],
          response_messages: {},
          reasoning_message_ids: [],
          reasoning_messages: {},
          created_at: '2024-03-20T12:01:00Z',
          final_reasoning_message: null,
          feedback: null
        }
      },
      created_at: '2024-03-20T12:00:00Z',
      updated_at: '2024-03-20T12:01:00Z',
      created_by: 'test-user',
      created_by_id: 'user123',
      created_by_name: 'Test User',
      created_by_avatar: null
    };

    const { iChat, iChatMessages } = updateChatToIChat(mockChat, true);

    expect(iChat.isNewChat).toBe(true);
    expect(iChatMessages.msg1.isCompletedStream).toBe(true);
    expect(iChatMessages.msg2.isCompletedStream).toBe(false);
  });
});
