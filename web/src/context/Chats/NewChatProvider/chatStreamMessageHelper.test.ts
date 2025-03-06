import {
  initializeOrUpdateMessage,
  updateChatTitle,
  updateResponseMessage
} from './chatStreamMessageHelper';
import { IBusterChatMessage, IBusterChat } from '../interfaces';
import { ChatEvent_GeneratingResponseMessage } from '@/api/buster_socket/chats';
import {
  BusterChatResponseMessage_file,
  BusterChatResponseMessage_text
} from '@/api/asset_interfaces';

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

describe('updateResponseMessage', () => {
  it('should create a new message when currentMessage is undefined', () => {
    const mockEvent: ChatEvent_GeneratingResponseMessage = {
      chat_id: 'test-chat-id',
      message_id: 'test-message-id',
      response_message: {
        id: 'response-1',
        type: 'text',
        message: '',
        message_chunk: 'Hello'
      } as BusterChatResponseMessage_text,
      progress: 'in_progress' as const
    };
    const result = updateResponseMessage('test-message-id', undefined, mockEvent);

    expect(result.id).toBe('test-message-id');
    expect(result.response_message_ids).toContain('response-1');
    expect(
      (result.response_messages['response-1'] as BusterChatResponseMessage_text).message
    ).toEqual('Hello');
  });

  it('should update existing message with new response', () => {
    const currentMessage: IBusterChatMessage = {
      id: 'test-message-id',
      isCompletedStream: false,
      request_message: {
        request: 'test request',
        sender_id: 'user1',
        sender_name: 'Test User',
        sender_avatar: null
      },
      response_message_ids: ['response-1'],
      reasoning_message_ids: [],
      response_messages: {
        'response-1': {
          id: 'response-1',
          type: 'text',
          message: 'Hello',
          message_chunk: undefined
        }
      },
      reasoning_messages: {},
      created_at: new Date().toISOString(),
      final_reasoning_message: null
    };

    const mockEvent: ChatEvent_GeneratingResponseMessage = {
      chat_id: 'test-chat-id',
      message_id: 'test-message-id',
      response_message: {
        id: 'response-1',
        type: 'text',
        message: '',
        message_chunk: ' World'
      } as BusterChatResponseMessage_text,
      progress: 'in_progress' as const
    };

    const result = updateResponseMessage('test-message-id', currentMessage, mockEvent);

    expect(result.response_message_ids).toContain('response-1');
    expect(
      (result.response_messages['response-1'] as BusterChatResponseMessage_text).message
    ).toEqual('Hello World');
  });

  it('should handle large message chunks correctly', () => {
    const currentMessage: IBusterChatMessage = {
      id: 'test-message-id',
      isCompletedStream: false,
      request_message: {
        request: 'test request',
        sender_id: 'user1',
        sender_name: 'Test User',
        sender_avatar: null
      },
      response_message_ids: ['response-1'],
      reasoning_message_ids: [],
      response_messages: {
        'response-1': {
          id: 'response-1',
          type: 'text',
          message: 'Initial message',
          message_chunk: undefined
        }
      },
      reasoning_messages: {},
      created_at: new Date().toISOString(),
      final_reasoning_message: null
    };

    const largeChunk =
      ' '.repeat(1000) +
      'This is a very large message chunk that should be appended correctly. '.repeat(10);

    const mockEvent: ChatEvent_GeneratingResponseMessage = {
      chat_id: 'test-chat-id',
      message_id: 'test-message-id',
      response_message: {
        id: 'response-1',
        type: 'text',
        message: '',
        message_chunk: largeChunk
      } as BusterChatResponseMessage_text,
      progress: 'in_progress' as const
    };

    const result = updateResponseMessage('test-message-id', currentMessage, mockEvent);

    expect(result.response_message_ids).toContain('response-1');
    expect(
      (result.response_messages['response-1'] as BusterChatResponseMessage_text).message
    ).toEqual('Initial message' + largeChunk);
  });

  it('should handle file type response messages', () => {
    const responseMessageFile: BusterChatResponseMessage_file = {
      id: 'response-1',
      type: 'file',
      file_name: 'initial.txt',
      file_type: 'metric',
      version_number: 1,
      version_id: '1',
      filter_version_id: '1'
    };

    const currentMessage: IBusterChatMessage = {
      id: 'test-message-id',
      isCompletedStream: false,
      request_message: {
        request: 'test request',
        sender_id: 'user1',
        sender_name: 'Test User',
        sender_avatar: null
      },
      response_message_ids: ['response-1'],
      reasoning_message_ids: [],
      response_messages: {
        'response-1': responseMessageFile
      },
      reasoning_messages: {},
      created_at: new Date().toISOString(),
      final_reasoning_message: null
    };

    const mockEvent: ChatEvent_GeneratingResponseMessage = {
      chat_id: 'test-chat-id',
      message_id: 'test-message-id',
      response_message: { ...responseMessageFile, id: 'response-2' },
      progress: 'in_progress' as const
    };

    const result = updateResponseMessage('test-message-id', currentMessage, mockEvent);

    expect(result.response_message_ids).toContain('response-2');
    expect(result.response_messages['response-2']).toEqual(mockEvent.response_message);
  });
});
