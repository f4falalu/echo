import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanupTestEnvironment, setupTestEnvironment } from '../envHelpers/env-helpers';
import { createTestMessageWithContext } from './messages/createTestMessageWithContext';

vi.mock('@buster/database', () => ({
  updateMessageFields: vi.fn(),
  getLatestMessageForChat: vi.fn(),
}));

describe('updateMessageFields - Unit Tests', () => {
  beforeEach(async () => {
    await setupTestEnvironment();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupTestEnvironment();
  });

  test('createTestMessageWithContext can be used for updateMessageFields testing', async () => {
    const result = await createTestMessageWithContext();
    
    expect(result).toHaveProperty('messageId');
    expect(result).toHaveProperty('chatId');
    expect(typeof result.messageId).toBe('string');
    expect(typeof result.chatId).toBe('string');
  });

  test('createTestMessageWithContext provides context for message updates', async () => {
    const result = await createTestMessageWithContext({
      title: 'Test Message for Updates',
      requestMessage: 'Initial request',
      isCompleted: false,
    });
    
    expect(result.messageId).toBeDefined();
    expect(result.userId).toBeDefined();
    expect(result.chatId).toBeDefined();
    expect(result.organizationId).toBeDefined();
  });
});
