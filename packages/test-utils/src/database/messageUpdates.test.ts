import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanupTestEnvironment, setupTestEnvironment } from '../envHelpers/env-helpers';
import { createTestMessageWithContext } from './messages/createTestMessageWithContext';

vi.mock('@buster/database', () => ({
  updateMessageReasoning: vi.fn(),
  updateMessageStreamingFields: vi.fn(),
}));

describe('Message Updates Test Helpers - Unit Tests', () => {
  beforeEach(async () => {
    await setupTestEnvironment();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupTestEnvironment();
  });

  test('createTestMessageWithContext provides context for message reasoning updates', async () => {
    const result = await createTestMessageWithContext({
      reasoning: { steps: ['Initial step'], conclusion: 'Test conclusion' },
    });
    
    expect(result).toHaveProperty('messageId');
    expect(result).toHaveProperty('userId');
    expect(result).toHaveProperty('chatId');
    expect(result).toHaveProperty('organizationId');
  });

  test('createTestMessageWithContext provides context for streaming field updates', async () => {
    const result = await createTestMessageWithContext({
      responseMessages: { content: 'Streaming response', metadata: { streaming: true } },
    });
    
    expect(result.messageId).toBeDefined();
    expect(result.userId).toBeDefined();
    expect(result.chatId).toBeDefined();
    expect(result.organizationId).toBeDefined();
  });

  test('createTestMessageWithContext can create messages with raw LLM messages', async () => {
    const rawLlmMessages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
    ];
    
    const result = await createTestMessageWithContext({
      rawLlmMessages,
      requestMessage: 'Hello',
    });
    
    expect(result.messageId).toBeDefined();
    expect(result.chatId).toBeDefined();
  });
});
