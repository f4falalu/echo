import { initializeOrUpdateMessage, updateChatTitle } from './chatStreamMessageHelper';
import { IBusterChatMessage, IBusterChat } from '../interfaces';

describe('initializeOrUpdateMessage', () => {
  it('should initialize a new message when currentMessage is undefined', () => {
    const messageId = 'test-id';
    const updateFn = (draft: IBusterChatMessage) => {
      if (draft.request_message) {
        draft.request_message.request = 'test request';
      }
    };

    const result = initializeOrUpdateMessage(messageId, undefined, updateFn);

    expect(result.id).toBe(messageId);
    expect(result.isCompletedStream).toBe(false);
    expect(result.request_message?.request).toBe('test request');
    expect(result.created_at).toBeDefined();
    expect(result.final_reasoning_message).toBeNull();
  });

  it('should update an existing message', () => {
    const messageId = 'test-id';
    const currentMessage: IBusterChatMessage = {
      id: messageId,
      isCompletedStream: false,
      request_message: {
        request: 'original request',
        sender_id: 'user1',
        sender_name: 'Test User',
        sender_avatar: null
      },
      response_message_ids: [],
      reasoning_message_ids: [],
      response_messages: {},
      reasoning_messages: {},
      created_at: new Date().toISOString(),
      final_reasoning_message: null
    };

    const updateFn = (draft: IBusterChatMessage) => {
      if (draft.request_message) {
        draft.request_message.request = 'updated request';
      }
    };

    const result = initializeOrUpdateMessage(messageId, currentMessage, updateFn);

    expect(result.id).toBe(messageId);
    expect(result.request_message?.request).toBe('updated request');
  });
});

const mockChat: IBusterChat = {
  id: 'test-chat-id',
  title: 'Initial Title',
  isNewChat: false,
  is_favorited: false,
  message_ids: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'test-user',
  created_by_id: 'test-user-id',
  created_by_name: 'Test User',
  created_by_avatar: null
};

describe('updateChatTitle', () => {
  it('should update title with a chunk when progress is not completed', () => {
    const event = {
      chat_id: 'test-chat-id',
      title: 'Final Title',
      title_chunk: ' New',
      progress: 'in_progress' as const
    };

    const result = updateChatTitle(mockChat, event);
    expect(result.title).toBe('Initial Title New');
  });

  it('should set the final title when progress is completed', () => {
    const event = {
      chat_id: 'test-chat-id',
      title: 'Final Title',
      title_chunk: '',
      progress: 'completed' as const
    };

    const result = updateChatTitle(mockChat, event);
    expect(result.title).toBe('Final Title');
  });

  it('should handle chat with empty initial title', () => {
    const chatWithoutTitle: IBusterChat = {
      ...mockChat,
      title: ''
    };

    const event = {
      chat_id: 'test-chat-id',
      title: 'Final Title',
      title_chunk: ' New',
      progress: 'in_progress' as const
    };

    const result = updateChatTitle(chatWithoutTitle, event);
    expect(result.title).toBe(' New');
  });

  it('should not modify title when title and title_chunk are empty', () => {
    const event = {
      chat_id: 'test-chat-id',
      title: '',
      title_chunk: '',
      progress: 'completed' as const
    };

    const result = updateChatTitle(mockChat, event);
    expect(result.title).toBe('Initial Title');
  });
});
