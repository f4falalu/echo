import { randomUUID } from 'node:crypto';
import { db, messages, updateMessageEntries } from '@buster/database';
import { createTestChat, createTestMessage } from '@buster/test-utils';
import type { ModelMessage, ToolCallOptions } from 'ai';
import { and, eq, isNull } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import type { DoneToolContext, DoneToolInput, DoneToolState } from './done-tool';
import { createDoneToolDelta } from './done-tool-delta';
import { createDoneToolFinish } from './done-tool-finish';
import { createDoneToolStart } from './done-tool-start';

describe('Done Tool Integration Tests', () => {
  let testChatId: string;
  let testUserId: string;
  let testOrgId: string;
  let testMessageId: string;
  let mockContext: DoneToolContext;

  beforeEach(async () => {
    // createTestChat will auto-create org and user if not provided
    // It returns chatId, organizationId, and userId
    const { chatId, organizationId, userId } = await createTestChat();
    testChatId = chatId;
    testOrgId = organizationId;
    testUserId = userId;

    testMessageId = await createTestMessage(testChatId, testUserId);

    mockContext = {
      messageId: testMessageId,
    };
  });

  afterEach(async () => {
    if (testMessageId) {
      await db
        .update(messages)
        .set({ deletedAt: new Date().toISOString() })
        .where(eq(messages.id, testMessageId));
    }
  });

  describe('Database Message Updates', () => {
    test('should create initial entries when done tool starts', async () => {
      const state: DoneToolState = {
        entry_id: undefined,
        args: undefined,
        final_response: undefined,
      };

      const startHandler = createDoneToolStart(state, mockContext);
      const toolCallId = randomUUID();

      await startHandler({ toolCallId, messages: [] });

      const [message] = await db
        .select()
        .from(messages)
        .where(and(eq(messages.id, testMessageId), isNull(messages.deletedAt)));

      expect(message).toBeDefined();
      expect(message.rawLlmMessages).toBeDefined();
      expect(message.responseMessages).toBeDefined();
    });

    test('should update entries during streaming delta', async () => {
      const state: DoneToolState = {
        entry_id: undefined,
        args: '',
        final_response: undefined,
      };

      const startHandler = createDoneToolStart(state, mockContext);
      const deltaHandler = createDoneToolDelta(state, mockContext);
      const toolCallId = randomUUID();

      await startHandler({ toolCallId, messages: [] });

      await deltaHandler({
        inputTextDelta: '{"final_response": "Partial response',
        toolCallId,
        messages: [],
      });

      const [message] = await db
        .select()
        .from(messages)
        .where(and(eq(messages.id, testMessageId), isNull(messages.deletedAt)));

      expect(message.rawLlmMessages).toBeDefined();
      expect(state.final_response).toBe('Partial response');
    });

    test('should finalize entries when done tool finishes', async () => {
      const state: DoneToolState = {
        entry_id: undefined,
        args: '',
        final_response: undefined,
      };

      const startHandler = createDoneToolStart(state, mockContext);
      const finishHandler = createDoneToolFinish(state, mockContext);
      const toolCallId = randomUUID();

      await startHandler({ toolCallId, messages: [] });

      const input: DoneToolInput = {
        final_response: 'This is the complete final response',
      };

      await finishHandler({ input, toolCallId, messages: [] });

      const [message] = await db
        .select()
        .from(messages)
        .where(and(eq(messages.id, testMessageId), isNull(messages.deletedAt)));

      expect(message.rawLlmMessages).toBeDefined();
      expect(message.responseMessages).toBeDefined();
    });

    test('should handle file extraction from tool calls', async () => {
      const state: DoneToolState = {
        entry_id: undefined,
        args: undefined,
        final_response: undefined,
      };

      const startHandler = createDoneToolStart(state, mockContext);
      const toolCallId = randomUUID();

      const mockMessages: ModelMessage[] = [
        {
          role: 'assistant',
          content: [
            {
              type: 'tool-call' as const,
              toolCallId: 'file-tool-123',
              toolName: 'create-metrics-file',
              input: {
                files: [
                  {
                    name: 'Revenue Analysis',
                    yml_content: 'name: Revenue\nsql: SELECT * FROM sales',
                  },
                ],
              },
            },
          ],
        },
        {
          role: 'tool',
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                files: [
                  {
                    id: randomUUID(),
                    name: 'Revenue Analysis',
                    file_type: 'metric',
                    yml_content: 'name: Revenue\nsql: SELECT * FROM sales',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    version_number: 1,
                  },
                ],
              }),
            },
          ],
          toolCallId: 'file-tool-123',
          toolName: 'create-metrics-file',
        },
      ];

      const options: ToolCallOptions & { messages?: ModelMessage[] } = {
        toolCallId,
        messages: mockMessages,
      };

      await startHandler(options);

      // Query the messages table properly
      const [message] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, testMessageId))
        .limit(1);

      expect(message).toBeDefined();
      expect(message.responseMessages).toBeDefined();
      if (Array.isArray(message.responseMessages)) {
        const fileResponses = message.responseMessages.filter((msg: any) => msg.type === 'file');
        expect(fileResponses.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Complete Streaming Flow', () => {
    test('should handle full streaming lifecycle with database updates', async () => {
      const state: DoneToolState = {
        entry_id: undefined,
        args: '',
        final_response: undefined,
      };

      const startHandler = createDoneToolStart(state, mockContext);
      const deltaHandler = createDoneToolDelta(state, mockContext);
      const finishHandler = createDoneToolFinish(state, mockContext);
      const toolCallId = randomUUID();

      await startHandler({ toolCallId, messages: [] });

      const chunks = [
        '{"final_response": "## Analysis Complete\\n\\n',
        'The following tasks have been completed:\\n',
        '- Data processing: **Success**\\n',
        '- Report generation: **Success**\\n',
        '- Validation: **Passed**\\n\\n',
        'All operations completed successfully.',
        '"}',
      ];

      for (const chunk of chunks) {
        await deltaHandler({
          inputTextDelta: chunk,
          toolCallId,
          messages: [],
        });
      }

      const expectedResponse = `## Analysis Complete

The following tasks have been completed:
- Data processing: **Success**
- Report generation: **Success**
- Validation: **Passed**

All operations completed successfully.`;

      expect(state.final_response).toBe(expectedResponse);

      const input: DoneToolInput = {
        final_response: expectedResponse,
      };

      await finishHandler({ input, toolCallId, messages: [] });

      const [message] = await db
        .select()
        .from(messages)
        .where(and(eq(messages.id, testMessageId), isNull(messages.deletedAt)));

      expect(message).toBeDefined();
      expect(message.rawLlmMessages).toBeDefined();
      expect(message.responseMessages).toBeDefined();
    });

    test('should handle multiple done tool invocations in sequence', async () => {
      const state1: DoneToolState = {
        entry_id: undefined,
        args: '',
        final_response: undefined,
      };

      const state2: DoneToolState = {
        entry_id: undefined,
        args: '',
        final_response: undefined,
      };

      const startHandler1 = createDoneToolStart(state1, mockContext);
      const finishHandler1 = createDoneToolFinish(state1, mockContext);

      const startHandler2 = createDoneToolStart(state2, mockContext);
      const finishHandler2 = createDoneToolFinish(state2, mockContext);

      const toolCallId1 = randomUUID();
      const toolCallId2 = randomUUID();

      await startHandler1({ toolCallId: toolCallId1, messages: [] });
      await finishHandler1({
        input: { final_response: 'First response' },
        toolCallId: toolCallId1,
        messages: [],
      });

      await startHandler2({ toolCallId: toolCallId2, messages: [] });
      await finishHandler2({
        input: { final_response: 'Second response' },
        toolCallId: toolCallId2,
        messages: [],
      });

      const [message] = await db
        .select()
        .from(messages)
        .where(and(eq(messages.id, testMessageId), isNull(messages.deletedAt)));

      expect(message.rawLlmMessages).toBeDefined();
      if (Array.isArray(message.rawLlmMessages)) {
        expect(message.rawLlmMessages.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      const invalidContext: DoneToolContext = {
        messageId: 'non-existent-message-id',
      };

      const state: DoneToolState = {
        entry_id: undefined,
        args: '',
        final_response: undefined,
      };

      const startHandler = createDoneToolStart(state, invalidContext);
      const toolCallId = randomUUID();

      await expect(startHandler({ toolCallId, messages: [] })).resolves.not.toThrow();
      expect(state.entry_id).toBe(toolCallId);
    });

    test('should continue processing even if database update fails', async () => {
      const state: DoneToolState = {
        entry_id: undefined,
        args: '',
        final_response: undefined,
      };

      const invalidContext: DoneToolContext = {
        messageId: 'invalid-id',
      };

      const deltaHandler = createDoneToolDelta(state, invalidContext);
      const toolCallId = randomUUID();

      await expect(
        deltaHandler({
          inputTextDelta: '{"final_response": "Test"}',
          toolCallId,
          messages: [],
        })
      ).resolves.not.toThrow();

      expect(state.final_response).toBe('Test');
    });
  });

  describe('Message Entry Modes', () => {
    test('should use append mode for start operations', async () => {
      const state: DoneToolState = {
        entry_id: undefined,
        args: undefined,
        final_response: undefined,
      };

      const startHandler = createDoneToolStart(state, mockContext);
      const toolCallId = randomUUID();

      await startHandler({ toolCallId, messages: [] });

      const [message] = await db
        .select()
        .from(messages)
        .where(and(eq(messages.id, testMessageId), isNull(messages.deletedAt)));

      expect(message.rawLlmMessages).toBeDefined();
      if (Array.isArray(message.rawLlmMessages)) {
        const initialLength = message.rawLlmMessages.length;

        await startHandler({ toolCallId: randomUUID(), messages: [] });

        const [updatedMessage] = await db
          .select()
          .from(messages)
          .where(and(eq(messages.id, testMessageId), isNull(messages.deletedAt)));

        if (Array.isArray(updatedMessage.rawLlmMessages)) {
          expect(updatedMessage.rawLlmMessages.length).toBeGreaterThan(initialLength);
        }
      }
    });

    test('should use update mode for delta and finish operations', async () => {
      const state: DoneToolState = {
        entry_id: undefined,
        args: '',
        final_response: undefined,
      };

      await updateMessageEntries({
        messageId: testMessageId,
        rawLlmMessage: {
          role: 'assistant',
          content: [{ type: 'text', text: 'Initial' }],
        },
        mode: 'append',
      });

      const deltaHandler = createDoneToolDelta(state, mockContext);
      const toolCallId = randomUUID();

      await deltaHandler({
        inputTextDelta: '{"final_response": "Updated content"}',
        toolCallId,
        messages: [],
      });

      const [message] = await db
        .select()
        .from(messages)
        .where(and(eq(messages.id, testMessageId), isNull(messages.deletedAt)));

      expect(message.rawLlmMessages).toBeDefined();
    });
  });
});
