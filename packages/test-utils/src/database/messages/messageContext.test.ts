import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanupTestEnvironment, setupTestEnvironment } from '../../envHelpers/env-helpers';
import { createTestMessageWithContext } from './createTestMessageWithContext';

vi.mock('@buster/database', () => ({
  getMessageContext: vi.fn(),
}));

describe('Message Context Helper - Unit Tests', () => {
  beforeEach(async () => {
    await setupTestEnvironment();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupTestEnvironment();
  });

  test('createTestMessageWithContext creates message with context', async () => {
    const result = await createTestMessageWithContext();
    
    expect(result).toHaveProperty('messageId');
    expect(result).toHaveProperty('userId');
    expect(result).toHaveProperty('chatId');
    expect(result).toHaveProperty('organizationId');
    
    expect(typeof result.messageId).toBe('string');
    expect(typeof result.userId).toBe('string');
    expect(typeof result.chatId).toBe('string');
    expect(typeof result.organizationId).toBe('string');
  });

  test('createTestMessageWithContext with custom options', async () => {
    const options = {
      title: 'Custom Test Message',
      requestMessage: 'Custom request',
      isCompleted: false,
    };
    
    const result = await createTestMessageWithContext(options);
    
    expect(result).toHaveProperty('messageId');
    expect(result).toHaveProperty('userId');
    expect(result).toHaveProperty('chatId');
    expect(result).toHaveProperty('organizationId');
  });
});
