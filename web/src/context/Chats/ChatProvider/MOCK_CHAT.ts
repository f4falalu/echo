import type {
  BusterChat,
  BusterChatMessage_text,
  BusterChatMessage_file,
  BusterChatMessageRequest,
  BusterChatMessage_fileMetadata,
  BusterChatMessageReasoning_Pills,
  BusterChatMessageReasoning_Pill,
  BusterChatMessageReasoning_files,
  BusterChatMessageReasoning_text,
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

const createMockResponseMessagePills = (): BusterChatMessageReasoning_Pills => {
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

const createMockReasoningMessageFile = (): BusterChatMessageReasoning_files => {
  const randomFileCount = faker.number.int({ min: 1, max: 3 });
  const files: BusterChatMessageReasoning_file[] = Array.from({ length: randomFileCount }, () => {
    const randomLineCount = faker.number.int({ min: 0, max: 5 });
    const fileLines =
      randomLineCount > 0
        ? Array.from({ length: randomLineCount }, (_, index) => ({
            text: faker.lorem.sentence(),
            line_number: index + 1,
            modified: faker.datatype.boolean()
          }))
        : undefined;

    return {
      id: faker.string.uuid(),
      file_type: faker.helpers.arrayElement(['metric', 'dashboard', 'reasoning']),
      file_name: faker.system.fileName(),
      version_number: faker.number.int({ min: 1, max: 10 }),
      version_id: faker.string.uuid(),
      status: faker.helpers.arrayElement(['loading', 'completed', 'failed']),
      file: fileLines
    };
  });

  return {
    id: faker.string.uuid(),
    type: 'files',
    title: faker.lorem.words(3),
    secondary_title: faker.datatype.boolean() ? faker.lorem.sentence() : undefined,
    status: faker.helpers.arrayElement(['loading', 'completed', 'failed']),
    files
  };
};

const createMockReasoningMessageText = (): BusterChatMessageReasoning_text => {
  return {
    id: faker.string.uuid(),
    type: 'text',
    message: faker.lorem.sentence(),
    title: faker.lorem.words(4),
    secondary_title: faker.lorem.sentence(),
    status: 'loading'
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
        createMockReasoningMessageText(),
        createMockReasoningMessageText(),
        ...Array.from({ length: 1 }, () => createMockResponseMessagePills()),
        createMockReasoningMessageFile()
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
