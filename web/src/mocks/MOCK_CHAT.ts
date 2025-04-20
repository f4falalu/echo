import {
  ShareRole,
  type BusterChat,
  type BusterChatMessage,
  type BusterChatMessageReasoning,
  type BusterChatMessageReasoning_file,
  type BusterChatMessageResponse
} from '@/api/asset_interfaces';
import { faker } from '@faker-js/faker';

const MOCK_MESSAGE_RESPONSE = (typeProp?: 'text' | 'file'): BusterChatMessageResponse => {
  const type = typeProp || faker.helpers.arrayElement(['text', 'file']);

  if (type === 'text') {
    return {
      id: faker.string.uuid(),
      type,
      message: faker.lorem.sentence(),
      is_final_message: false
    };
  }

  return {
    id: faker.string.uuid(),
    type: 'file',
    file_type: faker.helpers.arrayElement(['metric', 'dashboard']),
    file_name: faker.system.fileName(),
    version_number: faker.number.int({ min: 1, max: 10 }),
    filter_version_id: faker.string.uuid(),
    metadata: [
      {
        status: 'completed',
        message: 'Create your file',
        timestamp: 4200
      }
    ]
  };
};

const MOCK_MESSAGE_REASONING = (
  typeProp?: 'text' | 'files' | 'pills'
): BusterChatMessageReasoning => {
  const type = typeProp || faker.helpers.arrayElement(['text', 'files', 'pills']);

  if (type === 'text') {
    return {
      id: faker.string.uuid(),
      type: 'text',
      title: faker.lorem.sentence(),
      status: 'completed',
      message: faker.lorem.sentence(),
      secondary_title: '4.2 seconds'
    };
  }

  if (type === 'files') {
    const MOCK_FILE = (): BusterChatMessageReasoning_file => {
      return {
        id: faker.string.uuid(),
        file_type: faker.helpers.arrayElement(['metric', 'dashboard']),
        file_name: faker.system.fileName(),
        version_number: faker.number.int({ min: 1, max: 10 }),
        status: 'loading',
        file: {
          text: faker.lorem.sentence(),
          modified: [[0, 100]]
        }
      };
    };

    const files = Array.from({ length: 3 }, () => MOCK_FILE());

    return {
      id: faker.string.uuid(),
      type: 'files',
      title: faker.lorem.sentence(),
      secondary_title: faker.lorem.sentence(),
      status: 'completed',
      file_ids: files.map((f) => f.id),
      files: files.reduce<Record<string, BusterChatMessageReasoning_file>>((acc, f) => {
        acc[f.id] = f;
        return acc;
      }, {})
    };
  }

  return {
    id: faker.string.uuid(),
    type: 'pills',
    title: faker.lorem.sentence(),
    status: 'completed',
    secondary_title: '4.2 seconds',
    pill_containers: [
      {
        title: faker.lorem.sentence(),
        pills: []
      }
    ]
  };
};

const MOCK_MESSAGE = (): BusterChatMessage => {
  const responseTypes: ('text' | 'file')[] = ['text', 'file', 'file', 'file', 'text'];
  const responseMessage = Array.from({ length: 5 }, (_, i) =>
    MOCK_MESSAGE_RESPONSE(responseTypes[i])
  );

  const reasoningTypes: ('text' | 'files' | 'pills')[] = [
    'text',
    'pills',
    'files',
    'text',
    'files'
  ];
  const reasoningMessage = Array.from({ length: 5 }, (_, i) =>
    MOCK_MESSAGE_REASONING(reasoningTypes[i])
  );

  return {
    id: faker.string.uuid(),
    created_at: faker.date.past().toISOString(),
    request_message: {
      request: faker.lorem.sentence(),
      sender_id: faker.string.uuid(),
      sender_name: faker.person.fullName(),
      sender_avatar: faker.image.avatar()
    },
    final_reasoning_message: null,
    response_message_ids: responseMessage.map((m) => m.id),
    response_messages: responseMessage.reduce<Record<string, BusterChatMessageResponse>>(
      (acc, m) => {
        acc[m.id] = m;
        return acc;
      },
      {}
    ),
    reasoning_messages: reasoningMessage.reduce<Record<string, BusterChatMessageReasoning>>(
      (acc, m) => {
        acc[m.id] = m;
        return acc;
      },
      {}
    ),
    feedback: null,
    reasoning_message_ids: reasoningMessage.map((m) => m.id)
  };
};

export const MOCK_CHAT = (): BusterChat => {
  const messages = Array.from({ length: 3 }, () => MOCK_MESSAGE());
  const messageIds = messages.map((m) => m.id);

  return {
    id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    is_favorited: faker.datatype.boolean(),
    message_ids: messageIds,
    messages: messages.reduce<Record<string, BusterChatMessage>>((acc, m) => {
      acc[m.id] = m;
      return acc;
    }, {}),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.past().toISOString(),
    created_by: faker.person.fullName(),
    created_by_id: faker.string.uuid(),
    created_by_name: faker.person.fullName(),
    created_by_avatar: faker.image.avatar()
  };
};
