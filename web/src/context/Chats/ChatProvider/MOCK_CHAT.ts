import type {
  BusterChat,
  BusterChatMessage_text,
  BusterChatMessage_file,
  BusterChatMessageRequest,
  BusterChatMessage_fileMetadata,
  BusterChatMessageReasoning_pills,
  BusterChatMessageReasoning_Pill,
  BusterChatMessageReasoning_file
} from '@/api/asset_interfaces';
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
  message_chunk: faker.lorem.sentence({
    min: 5,
    max: 35
  })
});

const createMockResponseMessageThought = (): BusterChatMessageReasoning_pills => {
  const randomPillCount = faker.number.int({ min: 0, max: 10 });
  const fourRandomPills: BusterChatMessageReasoning_Pill[] = Array.from(
    { length: randomPillCount },
    () => {
      return {
        text: faker.lorem.word(),
        type: 'term',
        id: faker.string.uuid()
      };
    }
  );
  return {
    id: faker.string.uuid(),
    type: 'pills',
    title: `Found ${faker.number.int(100)} terms`,
    secondary_title: faker.lorem.word(),
    pill_containers: [
      {
        title: `Found ${faker.number.int(100)} terms`,
        pills: fourRandomPills
      },
      {
        title: `Found ${faker.number.int(100)} terms 2`,
        pills: fourRandomPills
      }
    ],
    status: undefined
  };
};

const createMockResponseMessageFile = (): BusterChatMessage_file => {
  const randomMetadataCount = faker.number.int({
    min: 1,
    max: 3
  });
  const randomMetadata: BusterChatMessage_fileMetadata[] = Array.from(
    { length: randomMetadataCount },
    () => {
      return {
        status: 'completed',
        message: faker.lorem.sentence(),
        timestamp: faker.number.int(100)
      };
    }
  );

  return {
    id: faker.string.uuid(),
    type: 'file',
    file_type: 'metric',
    version_number: 1,
    filter_version_id: null,
    version_id: faker.string.uuid(),
    file_name: faker.company.name(),
    metadata: randomMetadata
  };
};

const createMockReasoningMessageFile = (): BusterChatMessageReasoning_file => {
  return {
    id: 'swag' + faker.string.uuid(),
    type: 'file',
    file_type: 'metric',
    status: 'completed',
    file_name: faker.company.name(),
    version_number: 1,
    version_id: faker.string.uuid(),
    file: [
      {
        text: 'name: my-service\nversion: 1.0.0\ndescription: A sample service',
        line_number: 1,
        modified: false
      },
      {
        text: 'dependencies:\n  - name: redis\n    version: 6.2.0\n  - name: postgres\n    version: 13.4',
        line_number: 2
      },
      {
        text: 'ports:\n  - 8080\n  - 9000\n  - 6379',
        line_number: 3
      },
      {
        text: 'environment:\n  NODE_ENV: production\n  LOG_LEVEL: info\n  DB_HOST: localhost',
        line_number: 4
      }
    ]
  };
};

export const MOCK_CHAT: BusterChat = {
  id: '0',
  title: 'Mock Chat',
  is_favorited: false,
  messages: [
    {
      id: '123',
      created_at: '2025-01-01',
      request_message: createMockUserMessage(),
      final_reasoning_message: null,
      reasoning: [
        ...Array.from({ length: 1 }, () => createMockResponseMessageThought()),
        createMockReasoningMessageFile()
        // createMockReasoningMessageFile(),
        // createMockResponseMessageThought(),
        // createMockResponseMessageThought()
      ],
      response_messages: [
        createMockResponseMessageText(),
        createMockResponseMessageFile(),
        createMockResponseMessageFile(),
        createMockResponseMessageText(),
        createMockResponseMessageText()
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
