import {
  getLatestMessageForChat,
  updateMessageReasoning,
  updateMessageStreamingFields,
} from '@buster/database';
import { createTestMessageWithContext } from '@buster/test-utils';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { cleanupTestEnvironment, setupTestEnvironment } from '../../src/envHelpers/env-helpers';

describe('Message Update Helpers', () => {
  beforeEach(async () => {
    await setupTestEnvironment();
  });

  afterEach(async () => {
    await cleanupTestEnvironment();
  });

  describe('updateMessageReasoning', () => {
    test('successfully updates reasoning JSONB field', async () => {
      const { messageId, chatId } = await createTestMessageWithContext();

      const newReasoning = {
        steps: ['analyze data', 'identify patterns', 'generate insights'],
        conclusion: 'Analysis complete',
        confidence: 0.89,
        metadata: { duration: '45s' },
      };

      const result = await updateMessageReasoning(messageId, newReasoning);

      expect(result.success).toBe(true);

      // Verify the update was persisted
      const updatedMessage = await getLatestMessageForChat(chatId);
      expect(updatedMessage?.reasoning).toEqual(newReasoning);
    });

    test('handles simple reasoning object', async () => {
      const { messageId, chatId } = await createTestMessageWithContext();

      const simpleReasoning = {
        thought: 'This is a simple reasoning step',
      };

      const result = await updateMessageReasoning(messageId, simpleReasoning);

      expect(result.success).toBe(true);

      const updatedMessage = await getLatestMessageForChat(chatId);
      expect(updatedMessage?.reasoning).toEqual(simpleReasoning);
    });

    test('throws error when trying to set reasoning to null', async () => {
      const { messageId } = await createTestMessageWithContext();

      await expect(updateMessageReasoning(messageId, null)).rejects.toThrow(
        'Reasoning cannot be null - database constraint violation'
      );
    });

    test('throws error when trying to set reasoning to undefined', async () => {
      const { messageId } = await createTestMessageWithContext();

      await expect(updateMessageReasoning(messageId, undefined)).rejects.toThrow(
        'Reasoning cannot be null - database constraint violation'
      );
    });

    test('throws error for non-existent message ID', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await expect(updateMessageReasoning(nonExistentId, { thought: 'test' })).rejects.toThrow(
        `Message not found or has been deleted: ${nonExistentId}`
      );
    });
  });

  describe('updateMessageStreamingFields', () => {
    test('successfully updates both responseMessages and reasoning in single query', async () => {
      const { messageId, chatId } = await createTestMessageWithContext();

      const newResponseMessages = {
        content: 'Streaming response',
        tokens: 100,
      };

      const newReasoning = {
        step: 'processing',
        progress: 0.75,
      };

      const result = await updateMessageStreamingFields(
        messageId,
        newResponseMessages,
        newReasoning
      );

      expect(result.success).toBe(true);

      // Verify both fields were updated
      const updatedMessage = await getLatestMessageForChat(chatId);
      expect(updatedMessage?.responseMessages).toEqual(newResponseMessages);
      expect(updatedMessage?.reasoning).toEqual(newReasoning);
    });

    test('handles large streaming data efficiently', async () => {
      const { messageId, chatId } = await createTestMessageWithContext();

      // Simulate large streaming data
      const largeResponseMessages = {
        content: 'A'.repeat(10000), // Large content
        chunks: Array.from({ length: 1000 }, (_, i) => ({ id: i, data: `chunk-${i}` })),
      };

      const largeReasoning = {
        steps: Array.from({ length: 500 }, (_, i) => `reasoning-step-${i}`),
        detailed_analysis: 'B'.repeat(5000),
      };

      const result = await updateMessageStreamingFields(
        messageId,
        largeResponseMessages,
        largeReasoning
      );

      expect(result.success).toBe(true);

      const updatedMessage = await getLatestMessageForChat(chatId);
      expect(updatedMessage?.responseMessages).toEqual(largeResponseMessages);
      expect(updatedMessage?.reasoning).toEqual(largeReasoning);
    });

    test('throws error when reasoning is null', async () => {
      const { messageId } = await createTestMessageWithContext();

      const responseMessages = { content: 'valid response' };
      const reasoning = null;

      await expect(
        updateMessageStreamingFields(messageId, responseMessages, reasoning)
      ).rejects.toThrow('Reasoning cannot be null - database constraint violation');
    });

    test('throws error when reasoning is undefined', async () => {
      const { messageId } = await createTestMessageWithContext();

      const responseMessages = { content: 'valid response' };
      const reasoning = undefined;

      await expect(
        updateMessageStreamingFields(messageId, responseMessages, reasoning)
      ).rejects.toThrow('Reasoning cannot be null - database constraint violation');
    });

    test('overwrites previous data completely', async () => {
      const { messageId, chatId } = await createTestMessageWithContext();

      // First update
      const initialResponse = { content: 'initial', version: 1 };
      const initialReasoning = { step: 'initial', data: 'old' };

      await updateMessageStreamingFields(messageId, initialResponse, initialReasoning);

      // Second update should completely replace
      const newResponse = { content: 'updated', version: 2, newField: 'added' };
      const newReasoning = { step: 'updated', different: 'structure' };

      const result = await updateMessageStreamingFields(messageId, newResponse, newReasoning);

      expect(result.success).toBe(true);

      const updatedMessage = await getLatestMessageForChat(chatId);
      expect(updatedMessage?.responseMessages).toEqual(newResponse);
      expect(updatedMessage?.reasoning).toEqual(newReasoning);

      // Verify old fields are gone
      expect(updatedMessage?.responseMessages).not.toHaveProperty('version', 1);
      expect(updatedMessage?.reasoning).not.toHaveProperty('data');
    });

    test('throws error for non-existent message ID', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await expect(
        updateMessageStreamingFields(nonExistentId, { content: 'test' }, { step: 'test' })
      ).rejects.toThrow(`Message not found or has been deleted: ${nonExistentId}`);
    });
  });
});
