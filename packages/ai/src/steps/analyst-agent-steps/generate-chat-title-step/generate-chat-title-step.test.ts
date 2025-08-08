import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the AI models first
vi.mock('../../../llm/haiku-3-5', () => ({
  Haiku35: 'mock-haiku-model',
}));

// Mock database functions
vi.mock('@buster/database', () => ({
  updateChat: vi.fn(),
  updateMessage: vi.fn(),
}));

// Mock Braintrust
vi.mock('braintrust', () => ({
  wrapTraced: vi.fn((fn) => fn),
}));

// Mock the AI SDK
vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));

// Import after mocks are set up
import { updateChat, updateMessage } from '@buster/database';
import { generateObject } from 'ai';
import type { ModelMessage } from 'ai';
import { generateChatTitle } from './generate-chat-title-step';

const mockUpdateChat = updateChat as ReturnType<typeof vi.fn>;
const mockUpdateMessage = updateMessage as ReturnType<typeof vi.fn>;
const mockGenerateObject = generateObject as ReturnType<typeof vi.fn>;

describe('generateChatTitle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock behavior
    mockGenerateObject.mockResolvedValue({
      object: { title: 'Default Test Title' },
    });
    mockUpdateChat.mockResolvedValue({ success: true });
    mockUpdateMessage.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('title generation', () => {
    it('should generate title from user prompt', async () => {
      const mockTitle = 'Sales Analysis Dashboard';
      mockGenerateObject.mockResolvedValue({
        object: { title: mockTitle },
      });

      const result = await generateChatTitle({
        prompt: 'Show me sales data for Q1',
        conversationHistory: [],
      });

      expect(result.title).toBe(mockTitle);
      expect(mockGenerateObject).toHaveBeenCalledTimes(1);
      expect(mockGenerateObject).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'mock-haiku-model',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ 
              role: 'user',
              content: 'Show me sales data for Q1',
            }),
          ]),
        })
      );
    });

    it('should include conversation history in LLM context', async () => {
      const conversationHistory: ModelMessage[] = [
        { role: 'user', content: 'I need product data' },
        { role: 'assistant', content: 'What product data?' },
      ];

      await generateChatTitle({
        prompt: 'Show me laptop sales',
        conversationHistory,
      });

      expect(mockGenerateObject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            { role: 'user', content: 'I need product data' },
            { role: 'assistant', content: 'What product data?' },
            { role: 'user', content: 'Show me laptop sales' },
          ]),
        })
      );
    });

    it('should return fallback title when LLM returns null', async () => {
      mockGenerateObject.mockResolvedValue({
        object: { title: null },
      });

      const result = await generateChatTitle({
        prompt: 'Test prompt',
      });

      expect(result.title).toBe('New Analysis');
    });

    it('should return fallback title when LLM returns undefined', async () => {
      mockGenerateObject.mockResolvedValue({
        object: {},
      });

      const result = await generateChatTitle({
        prompt: 'Test prompt',
      });

      expect(result.title).toBe('New Analysis');
    });
  });

  describe('database updates', () => {
    it('should update chat when chatId is provided', async () => {
      const chatId = 'chat-123';
      const title = 'Revenue Analysis';
      
      mockGenerateObject.mockResolvedValue({
        object: { title },
      });

      await generateChatTitle({
        prompt: 'Show revenue',
        chatId,
      });

      expect(mockUpdateChat).toHaveBeenCalledTimes(1);
      expect(mockUpdateChat).toHaveBeenCalledWith(chatId, { title });
    });

    it('should update message when messageId is provided', async () => {
      const messageId = 'msg-456';
      const title = 'Customer Metrics';
      
      mockGenerateObject.mockResolvedValue({
        object: { title },
      });

      await generateChatTitle({
        prompt: 'Customer data',
        messageId,
      });

      expect(mockUpdateMessage).toHaveBeenCalledTimes(1);
      expect(mockUpdateMessage).toHaveBeenCalledWith(messageId, { title });
    });

    it('should update both chat and message when both IDs provided', async () => {
      const chatId = 'chat-789';
      const messageId = 'msg-789';
      const title = 'Combined Analysis';
      
      mockGenerateObject.mockResolvedValue({
        object: { title },
      });

      await generateChatTitle({
        prompt: 'Analysis request',
        chatId,
        messageId,
      });

      expect(mockUpdateChat).toHaveBeenCalledTimes(1);
      expect(mockUpdateChat).toHaveBeenCalledWith(chatId, { title });
      expect(mockUpdateMessage).toHaveBeenCalledTimes(1);
      expect(mockUpdateMessage).toHaveBeenCalledWith(messageId, { title });
    });

    it('should not update database when no IDs provided', async () => {
      await generateChatTitle({
        prompt: 'Test prompt',
      });

      expect(mockUpdateChat).not.toHaveBeenCalled();
      expect(mockUpdateMessage).not.toHaveBeenCalled();
    });

    it('should handle database update failures gracefully', async () => {
      const chatId = 'chat-fail';
      mockUpdateChat.mockRejectedValue(new Error('Database error'));
      
      mockGenerateObject.mockResolvedValue({
        object: { title: 'Test Title' },
      });

      // Should not throw even if database update fails
      const result = await generateChatTitle({
        prompt: 'Test prompt',
        chatId,
      });

      expect(result.title).toBe('Test Title');
    });
  });

  describe('error handling', () => {
    it('should handle LLM generation errors and return fallback', async () => {
      mockGenerateObject.mockRejectedValue(new Error('LLM service unavailable'));

      const result = await generateChatTitle({
        prompt: 'Test prompt',
      });

      expect(result.title).toBe('New Analysis');
    });

    it('should handle AbortError and return fallback title', async () => {
      const abortError = new Error('Operation aborted');
      abortError.name = 'AbortError';
      
      mockGenerateObject.mockRejectedValue(abortError);

      const result = await generateChatTitle({
        prompt: 'Test prompt',
      });

      expect(result.title).toBe('New Analysis');
    });

    it('should handle unexpected errors and return fallback', async () => {
      mockGenerateObject.mockRejectedValue('Unexpected error format');

      const result = await generateChatTitle({
        prompt: 'Test prompt',
      });

      expect(result.title).toBe('New Analysis');
    });

    it('should continue with title generation even if database updates fail', async () => {
      const title = 'Success Title';
      mockGenerateObject.mockResolvedValue({
        object: { title },
      });
      
      mockUpdateChat.mockRejectedValue(new Error('DB Error'));
      mockUpdateMessage.mockRejectedValue(new Error('DB Error'));

      const result = await generateChatTitle({
        prompt: 'Test prompt',
        chatId: 'chat-123',
        messageId: 'msg-123',
      });

      expect(result.title).toBe(title);
    });
  });

  describe('edge cases', () => {
    it('should handle empty prompt', async () => {
      mockGenerateObject.mockResolvedValue({
        object: { title: 'Empty Prompt Title' },
      });

      const result = await generateChatTitle({
        prompt: '',
      });

      expect(result.title).toBeDefined();
      expect(mockGenerateObject).toHaveBeenCalled();
    });

    it('should handle very long prompts', async () => {
      const longPrompt = 'x'.repeat(10000);
      mockGenerateObject.mockResolvedValue({
        object: { title: 'Long Prompt Title' },
      });

      const result = await generateChatTitle({
        prompt: longPrompt,
      });

      expect(result.title).toBe('Long Prompt Title');
    });

    it('should handle empty conversation history array', async () => {
      const result = await generateChatTitle({
        prompt: 'Test',
        conversationHistory: [],
      });

      expect(result.title).toBeDefined();
      expect(mockGenerateObject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user', content: 'Test' }),
          ]),
        })
      );
    });

    it('should handle undefined conversation history', async () => {
      const result = await generateChatTitle({
        prompt: 'Test',
        conversationHistory: undefined,
      });

      expect(result.title).toBeDefined();
      expect(mockGenerateObject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user', content: 'Test' }),
          ]),
        })
      );
    });

    it('should handle special characters in title', async () => {
      const specialTitle = 'Sales & Marketing | Q1-Q2 (2024)';
      mockGenerateObject.mockResolvedValue({
        object: { title: specialTitle },
      });

      const result = await generateChatTitle({
        prompt: 'Sales and marketing analysis',
      });

      expect(result.title).toBe(specialTitle);
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent title generations', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        generateChatTitle({
          prompt: `Prompt ${i}`,
        })
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result.title).toBeDefined();
      });
    });

    it('should handle concurrent database updates', async () => {
      const title = 'Concurrent Title';
      mockGenerateObject.mockResolvedValue({
        object: { title },
      });

      const promises = Array.from({ length: 3 }, (_, i) =>
        generateChatTitle({
          prompt: 'Test',
          chatId: `chat-${i}`,
          messageId: `msg-${i}`,
        })
      );

      await Promise.all(promises);

      expect(mockUpdateChat).toHaveBeenCalledTimes(3);
      expect(mockUpdateMessage).toHaveBeenCalledTimes(3);
    });
  });
});