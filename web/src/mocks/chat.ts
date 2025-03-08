import type { IBusterChatMessage } from '@/api/asset_interfaces';

export const mockBusterChatMessage: IBusterChatMessage = {
  id: 'message-1',
  isCompletedStream: true,
  created_at: new Date().toISOString(),
  request_message: {
    request: 'test request',
    sender_id: 'user1',
    sender_name: 'Test User',
    sender_avatar: null
  },
  response_message_ids: [],
  reasoning_message_ids: ['reasoning-1', 'reasoning-2', 'reasoning-3'],
  response_messages: {},
  final_reasoning_message: null,
  reasoning_messages: {
    'reasoning-1': {
      id: 'reasoning-1',
      type: 'text',
      title: 'Text Reasoning',
      secondary_title: 'Additional Context',
      message: 'This is a text reasoning message',
      status: 'completed'
    },
    'reasoning-2': {
      id: 'reasoning-2',
      type: 'pills',
      title: 'Pills Reasoning',
      secondary_title: 'Selected Files',
      status: 'completed',
      pill_containers: [
        {
          title: 'Found Files',
          pills: [
            { text: 'File 1', type: 'metric', id: 'file-1' },
            { text: 'File 2', type: 'dashboard', id: 'file-2' },
            { text: 'File 3', type: 'collection', id: 'file-3' }
          ]
        }
      ]
    },
    'reasoning-3': {
      id: 'reasoning-3',
      type: 'files',
      title: 'Files Reasoning',
      secondary_title: 'Modified Files',
      status: 'completed',
      file_ids: ['file-1', 'file-2'],
      files: {
        'file-1': {
          id: 'file-1',
          file_type: 'metric',
          file_name: 'test.ts',
          version_number: 1,
          version_id: 'v1',
          status: 'completed',
          file: {
            text: 'console.log("Hello World");\nconsole.log("Hello World");\nconsole.log("Hello World");\n',
            modified: [[1, 1]]
          }
        },
        'file-2': {
          id: 'file-2',
          file_type: 'dashboard',
          file_name: 'example.js',
          version_number: 1,
          version_id: 'v1',
          status: 'completed',
          file: {
            text: 'console.log("Example");\nconsole.log("Example");\nconsole.log("Example");\n',
            modified: []
          }
        }
      }
    }
  }
};
