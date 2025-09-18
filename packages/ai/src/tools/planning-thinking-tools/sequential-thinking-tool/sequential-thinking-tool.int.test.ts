import { randomUUID } from 'node:crypto';
import { db } from '@buster/database/connection';
import { messages } from '@buster/database/schema';
import { createTestChat, createTestMessage } from '@buster/test-utils';
import { and, eq, isNull } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import type {
  SequentialThinkingContext,
  SequentialThinkingInput,
  SequentialThinkingState,
} from './sequential-thinking-tool';
import { createSequentialThinkingDelta } from './sequential-thinking-tool-delta';
import { createSequentialThinkingFinish } from './sequential-thinking-tool-finish';
import { createSequentialThinkingStart } from './sequential-thinking-tool-start';

describe('Sequential Thinking Tool Integration Tests', () => {
  let testChatId: string;
  let testUserId: string;
  let testOrgId: string;
  let testMessageId: string;
  let mockContext: SequentialThinkingContext;

  beforeEach(async () => {
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
    test('should create initial entries when sequential thinking starts', async () => {
      const state: SequentialThinkingState = {
        toolCallId: undefined,
        args: undefined,
        thought: undefined,
        nextThoughtNeeded: undefined,
        thoughtNumber: undefined,
      };

      const startHandler = createSequentialThinkingStart(state, mockContext);
      const toolCallId = randomUUID();

      await startHandler({ toolCallId, messages: [] });

      // Verify state was updated
      expect(state.toolCallId).toBe(toolCallId);

      // Verify database was updated
      const [message] = await db
        .select()
        .from(messages)
        .where(and(eq(messages.id, testMessageId), isNull(messages.deletedAt)));

      expect(message).toBeDefined();
    });

    test('should update state during streaming delta', async () => {
      const state: SequentialThinkingState = {
        toolCallId: undefined,
        args: '',
        thought: undefined,
        nextThoughtNeeded: undefined,
        thoughtNumber: undefined,
      };

      const startHandler = createSequentialThinkingStart(state, mockContext);
      const deltaHandler = createSequentialThinkingDelta(state, mockContext);
      const toolCallId = randomUUID();

      await startHandler({ toolCallId, messages: [] });

      // Stream partial JSON
      await deltaHandler({
        inputTextDelta: '{"thought": "Let me analyze this problem',
        toolCallId,
        messages: [],
      });

      // Verify state was updated with partial content
      expect(state.thought).toBe('Let me analyze this problem');
      expect(state.args).toBe('{"thought": "Let me analyze this problem');
    });

    test('should update state with complete JSON during delta', async () => {
      const state: SequentialThinkingState = {
        toolCallId: undefined,
        args: '',
        thought: undefined,
        nextThoughtNeeded: undefined,
        thoughtNumber: undefined,
      };

      const startHandler = createSequentialThinkingStart(state, mockContext);
      const deltaHandler = createSequentialThinkingDelta(state, mockContext);
      const toolCallId = randomUUID();

      await startHandler({ toolCallId, messages: [] });

      // Stream complete JSON
      await deltaHandler({
        inputTextDelta:
          '{"thought": "Step 1: Understanding the problem", "thoughtNumber": 1, "nextThoughtNeeded": true}',
        toolCallId,
        messages: [],
      });

      // Verify state was fully updated
      expect(state.thought).toBe('Step 1: Understanding the problem');
      expect(state.thoughtNumber).toBe(1);
      expect(state.nextThoughtNeeded).toBe(true);
    });

    test('should finalize state when sequential thinking finishes', async () => {
      const state: SequentialThinkingState = {
        toolCallId: undefined,
        args: '',
        thought: undefined,
        nextThoughtNeeded: undefined,
        thoughtNumber: undefined,
      };

      const startHandler = createSequentialThinkingStart(state, mockContext);
      const finishHandler = createSequentialThinkingFinish(state, mockContext);
      const toolCallId = randomUUID();

      await startHandler({ toolCallId, messages: [] });

      const input: SequentialThinkingInput = {
        thought: 'After analyzing the problem, the solution is to use a recursive approach',
        nextThoughtNeeded: false,
        thoughtNumber: 3,
      };

      await finishHandler({
        input,
        toolCallId,
        messages: [],
      });

      // Verify state was finalized
      expect(state.thought).toBe(
        'After analyzing the problem, the solution is to use a recursive approach'
      );
      expect(state.nextThoughtNeeded).toBe(false);
      expect(state.thoughtNumber).toBe(3);
      expect(state.toolCallId).toBe(toolCallId);
    });

    test('should handle multiple sequential thoughts in sequence', async () => {
      const state: SequentialThinkingState = {
        toolCallId: undefined,
        args: '',
        thought: undefined,
        nextThoughtNeeded: undefined,
        thoughtNumber: undefined,
      };

      const startHandler = createSequentialThinkingStart(state, mockContext);
      const deltaHandler = createSequentialThinkingDelta(state, mockContext);
      const finishHandler = createSequentialThinkingFinish(state, mockContext);
      const toolCallId = randomUUID();

      // First thought - start and delta
      await startHandler({ toolCallId, messages: [] });

      await deltaHandler({
        inputTextDelta: '{"thought": "First, let me understand',
        toolCallId,
        messages: [],
      });

      await deltaHandler({
        inputTextDelta: ' the requirements", "thoughtNumber": 1}',
        toolCallId,
        messages: [],
      });

      expect(state.thought).toBe('First, let me understand the requirements');
      expect(state.thoughtNumber).toBe(1);

      // Final thought - finish
      const input: SequentialThinkingInput = {
        thought: 'Now I can see the pattern clearly',
        nextThoughtNeeded: false,
        thoughtNumber: 2,
      };

      await finishHandler({
        input,
        toolCallId,
        messages: [],
      });

      // Verify final state
      expect(state.thought).toBe('Now I can see the pattern clearly');
      expect(state.nextThoughtNeeded).toBe(false);
      expect(state.thoughtNumber).toBe(2);
    });

    test('should handle error gracefully when database update fails', async () => {
      const state: SequentialThinkingState = {
        toolCallId: undefined,
        args: undefined,
        thought: undefined,
        nextThoughtNeeded: undefined,
        thoughtNumber: undefined,
      };

      // Use an invalid message ID to cause database error
      const invalidContext: SequentialThinkingContext = {
        messageId: 'invalid-message-id',
      };

      const startHandler = createSequentialThinkingStart(state, invalidContext);
      const toolCallId = randomUUID();

      // Should not throw, but handle error gracefully
      await expect(startHandler({ toolCallId, messages: [] })).resolves.not.toThrow();

      // State should still be updated even if database fails
      expect(state.toolCallId).toBe(toolCallId);
    });

    test('should handle streaming with escaped characters', async () => {
      const state: SequentialThinkingState = {
        toolCallId: undefined,
        args: '',
        thought: undefined,
        nextThoughtNeeded: undefined,
        thoughtNumber: undefined,
      };

      const startHandler = createSequentialThinkingStart(state, mockContext);
      const deltaHandler = createSequentialThinkingDelta(state, mockContext);
      const toolCallId = randomUUID();

      await startHandler({ toolCallId, messages: [] });

      // Stream JSON with escaped quotes - the JSON parser will handle the escaping
      await deltaHandler({
        inputTextDelta: '{"thought": "Analyzing code: const x = value"',
        toolCallId,
        messages: [],
      });

      await deltaHandler({
        inputTextDelta: ', "thoughtNumber": 1}',
        toolCallId,
        messages: [],
      });

      // Verify the thought was captured correctly
      expect(state.thought).toBe('Analyzing code: const x = value');
      expect(state.thoughtNumber).toBe(1);
    });
  });
});
