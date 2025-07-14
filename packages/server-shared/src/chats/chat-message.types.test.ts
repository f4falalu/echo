import { describe, expect, it } from 'vitest';
import {
  ChatMessageSchema,
  ReasoningMessageSchema,
  ResponseMessageSchema,
} from './chat-message.types';

describe('ChatMessageSchema', () => {
  it('should parse a valid complete chat message', () => {
    const validMessage = {
      id: 'msg-123',
      request_message: {
        request: 'What is the revenue?',
        sender_id: 'user-123',
        sender_name: 'John Doe',
        sender_avatar: 'https://example.com/avatar.jpg',
      },
      response_messages: {},
      response_message_ids: [],
      reasoning_message_ids: [],
      reasoning_messages: {},
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      final_reasoning_message: null,
      feedback: null,
      is_completed: true,
    };

    const result = ChatMessageSchema.safeParse(validMessage);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe('msg-123');
      expect(result.data.is_completed).toBe(true);
    }
  });

  it('should handle null request message', () => {
    const messageWithNullRequest = {
      id: 'msg-123',
      request_message: null,
      response_messages: {},
      response_message_ids: [],
      reasoning_message_ids: [],
      reasoning_messages: {},
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      final_reasoning_message: null,
      feedback: null,
      is_completed: false,
    };

    const result = ChatMessageSchema.safeParse(messageWithNullRequest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.request_message).toBeNull();
    }
  });

  it('should handle optional fields in request message', () => {
    const messageWithOptionalFields = {
      id: 'msg-123',
      request_message: {
        request: 'What is the revenue?',
        sender_id: 'user-123',
        sender_name: 'John Doe',
        // sender_avatar is optional
      },
      response_messages: {},
      response_message_ids: [],
      reasoning_message_ids: [],
      reasoning_messages: {},
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      final_reasoning_message: null,
      feedback: null,
      is_completed: false,
    };

    const result = ChatMessageSchema.safeParse(messageWithOptionalFields);
    expect(result.success).toBe(true);
  });
});

describe('ResponseMessageSchema', () => {
  it('should parse text response message', () => {
    const textMessage = {
      id: 'resp-123',
      type: 'text',
      message: 'Here is your answer',
    };

    const result = ResponseMessageSchema.safeParse(textMessage);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('text');
      if (result.data.type === 'text') {
        expect(result.data.message).toBe('Here is your answer');
      }
    }
  });

  it('should parse file response message with metadata', () => {
    const fileMessage = {
      id: 'resp-456',
      type: 'file',
      file_type: 'metric',
      file_name: 'revenue_analysis.yaml',
      version_number: 1,
      filter_version_id: 'filter-123',
      metadata: [
        {
          status: 'completed',
          message: 'Analysis complete',
          timestamp: 1640995200000,
        },
      ],
    };

    const result = ResponseMessageSchema.safeParse(fileMessage);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('file');
      if (result.data.type === 'file') {
        expect(result.data.file_type).toBe('metric');
        expect(result.data.metadata).toHaveLength(1);
      }
    }
  });

  it('should handle optional metadata fields', () => {
    const fileMessageWithoutOptionals = {
      id: 'resp-456',
      type: 'file',
      file_type: 'dashboard',
      file_name: 'sales_dashboard.yaml',
      version_number: 2,
    };

    const result = ResponseMessageSchema.safeParse(fileMessageWithoutOptionals);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('file');
      if (result.data.type === 'file') {
        expect(result.data.file_type).toBe('dashboard');
        expect(result.data.metadata).toBeUndefined();
        expect(result.data.filter_version_id).toBeUndefined();
      }
    }
  });
});

describe('ReasoningMessageSchema', () => {
  it('should parse text reasoning message', () => {
    const textReasoning = {
      id: 'reason-123',
      type: 'text',
      title: 'Analyzing Data',
      status: 'loading',
    };

    const result = ReasoningMessageSchema.safeParse(textReasoning);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('text');
      expect(result.data.title).toBe('Analyzing Data');
      expect(result.data.status).toBe('loading');
    }
  });

  it('should parse files reasoning message with nested file objects', () => {
    const filesReasoning = {
      id: 'reason-456',
      type: 'files',
      title: 'Generated Files',
      status: 'completed',
      file_ids: ['file-1', 'file-2'],
      files: {
        'file-1': {
          id: 'file-1',
          file_type: 'metric',
          file_name: 'revenue.yaml',
          version_number: 1,
          status: 'completed',
          file: {
            text: 'metric content here',
            modified: [
              [0, 10],
              [20, 30],
            ],
          },
        },
        'file-2': {
          id: 'file-2',
          file_type: 'dashboard',
          file_name: 'dashboard.yaml',
          status: 'loading',
          file: {
            text: 'dashboard content',
          },
        },
      },
    };

    const result = ReasoningMessageSchema.safeParse(filesReasoning);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('files');
      if (result.data.type === 'files') {
        expect(result.data.file_ids).toHaveLength(2);
        expect(result.data.files['file-1']?.file_type).toBe('metric');
        expect(result.data.files['file-1']?.file?.modified).toEqual([
          [0, 10],
          [20, 30],
        ]);
        expect(result.data.files['file-2']?.file?.modified).toBeUndefined();
      }
    }
  });

  it('should parse pills reasoning message with nested pill containers', () => {
    const pillsReasoning = {
      id: 'reason-789',
      type: 'pills',
      title: 'Related Items',
      status: 'completed',
      pill_containers: [
        {
          title: 'Metrics',
          pills: [
            {
              text: 'Revenue',
              type: 'metric',
              id: 'metric-1',
            },
            {
              text: 'Profit',
              type: 'metric',
              id: 'metric-2',
            },
          ],
        },
        {
          title: 'Dashboards',
          pills: [
            {
              text: 'Sales Overview',
              type: 'dashboard',
              id: 'dashboard-1',
            },
          ],
        },
      ],
    };

    const result = ReasoningMessageSchema.safeParse(pillsReasoning);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('pills');
      if (result.data.type === 'pills') {
        expect(result.data.pill_containers).toHaveLength(2);
        expect(result.data.pill_containers?.[0]?.pills).toHaveLength(2);
        expect(result.data.pill_containers?.[0]?.pills?.[0]?.type).toBe('metric');
        expect(result.data.pill_containers?.[1]?.pills?.[0]?.text).toBe('Sales Overview');
      }
    }
  });

  it('should handle optional finished_reasoning field', () => {
    const reasoningWithFinished = {
      id: 'reason-123',
      type: 'text',
      title: 'Complete Analysis',
      status: 'completed',
      finished_reasoning: true,
    };

    const result = ReasoningMessageSchema.safeParse(reasoningWithFinished);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.finished_reasoning).toBe(true);
    }
  });

  it('should handle all optional fields in text reasoning', () => {
    const textWithOptionals = {
      id: 'reason-999',
      type: 'text',
      title: 'Analysis',
      secondary_title: 'Revenue Analysis',
      message: 'Detailed analysis message',
      message_chunk: 'Partial message',
      status: 'loading',
      finished_reasoning: false,
    };

    const result = ReasoningMessageSchema.safeParse(textWithOptionals);
    expect(result.success).toBe(true);
    if (result.success) {
      if (result.data.type === 'text') {
        expect(result.data.secondary_title).toBe('Revenue Analysis');
        expect(result.data.message).toBe('Detailed analysis message');
        expect(result.data.message_chunk).toBe('Partial message');
      }
    }
  });
});
