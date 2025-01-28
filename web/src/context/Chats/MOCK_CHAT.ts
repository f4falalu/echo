import {
  type BusterChat,
  type BusterChatMessage_text,
  type BusterChatMessage_file,
  type BusterChatMessage_thought,
  type BusterChatMessageRequest,
  type BusterChatMessageResponse,
  FileType
} from '@/api/buster_socket/chats';
import { faker } from '@faker-js/faker';

const createMockUserMessage = (
  message: string = faker.lorem.sentence(12)
): BusterChatMessageRequest => ({
  request: message,
  sender_id: faker.string.uuid(),
  sender_name: faker.person.fullName(),
  sender_avatar: faker.image.avatar()
});

const createMockResponseMessageText = (): BusterChatMessage_text => ({
  id: faker.string.uuid(),
  type: 'text',
  message: '',
  message_chunk: faker.lorem.sentence()
});

const createMockResponseMessageThought = (): BusterChatMessage_thought => ({
  id: faker.string.uuid(),
  type: 'thought',
  thought_title: `Found ${faker.number.int(100)} terms`,
  thought_secondary_title: faker.lorem.word(),
  thought_pills: [],
  hidden: false,
  in_progress: false
});

const createMockResponseMessageFile = (): BusterChatMessage_file => ({
  id: faker.string.uuid(),
  type: 'file',
  file_type: 'metric',
  version_number: 1,
  version_id: faker.string.uuid()
});

export const MOCK_CHAT: BusterChat = {
  id: '0',
  title: 'Mock Chat',
  is_favorited: false,
  messages: [
    {
      id: faker.string.uuid(),
      created_at: '2025-01-01',
      request_message: createMockUserMessage(),
      response_messages: [
        createMockResponseMessageText(),
        createMockResponseMessageThought(),
        createMockResponseMessageThought(),
        createMockResponseMessageThought(),
        createMockResponseMessageThought(),
        createMockResponseMessageFile(),
        createMockResponseMessageFile()
      ]
    }
  ],
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
  created_by: 'Mock User',
  created_by_id: '1',
  created_by_name: 'Mock User',
  created_by_avatar: ''
};
