import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the AI models first
vi.mock('../../../llm/sonnet-4', () => ({
  Sonnet4: 'mock-sonnet-model',
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
import { generateObject } from 'ai';
import type { ModelMessage } from 'ai';
import { createTodos } from './create-todos-step';

const mockGenerateObject = generateObject as ReturnType<typeof vi.fn>;

describe('createTodos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default mock behavior
    mockGenerateObject.mockResolvedValue({
      object: { todos: '[ ] Default test todo' },
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('todo generation', () => {
    it('should generate todos from user prompt', async () => {
      const mockTodos = '[ ] Determine how sales is identified\n[ ] Determine the time period';
      mockGenerateObject.mockResolvedValue({
        object: { todos: mockTodos },
      });

      const result = await createTodos({
        prompt: 'Show me sales data',
        conversationHistory: [],
      });

      expect(result.todos).toBe(mockTodos);
      expect(mockGenerateObject).toHaveBeenCalledTimes(1);
      expect(mockGenerateObject).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'mock-sonnet-model',
          temperature: 0,
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({
              role: 'user',
              content: 'Show me sales data',
            }),
          ]),
        })
      );
    });

    it('should include conversation history in LLM context', async () => {
      const conversationHistory: ModelMessage[] = [
        { role: 'user', content: 'I need product data' },
        { role: 'assistant', content: 'What product data would you like?' },
      ];

      await createTodos({
        prompt: 'Show me laptop sales',
        conversationHistory,
      });

      expect(mockGenerateObject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            { role: 'user', content: 'I need product data' },
            { role: 'assistant', content: 'What product data would you like?' },
            { role: 'user', content: 'Show me laptop sales' },
          ]),
        })
      );
    });

    it('should use temperature 0 for consistent results', async () => {
      await createTodos({
        prompt: 'Test prompt',
      });

      expect(mockGenerateObject).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0,
        })
      );
    });

    it('should return empty string when LLM returns null', async () => {
      mockGenerateObject.mockResolvedValue({
        object: { todos: null },
      });

      const result = await createTodos({
        prompt: 'Test prompt',
      });

      expect(result.todos).toBe('');
    });

    it('should return empty string when LLM returns undefined', async () => {
      mockGenerateObject.mockResolvedValue({
        object: {},
      });

      const result = await createTodos({
        prompt: 'Test prompt',
      });

      expect(result.todos).toBe('');
    });

    it('should handle multi-line todos correctly', async () => {
      const multiLineTodos = `[ ] First todo item
[ ] Second todo item
[ ] Third todo item with longer description
[ ] Fourth todo item`;

      mockGenerateObject.mockResolvedValue({
        object: { todos: multiLineTodos },
      });

      const result = await createTodos({
        prompt: 'Complex query',
      });

      expect(result.todos).toBe(multiLineTodos);
      expect(result.todos.split('\n')).toHaveLength(4);
    });
  });

  describe('error handling', () => {
    it('should return empty todos when LLM fails', async () => {
      mockGenerateObject.mockRejectedValue(new Error('LLM service unavailable'));

      const result = await createTodos({
        prompt: 'Test prompt',
      });

      expect(result.todos).toBe('');
    });

    it('should handle AbortError and return empty todos', async () => {
      const abortError = new Error('Operation aborted');
      abortError.name = 'AbortError';

      mockGenerateObject.mockRejectedValue(abortError);

      const result = await createTodos({
        prompt: 'Test prompt',
      });

      expect(result.todos).toBe('');
    });

    it('should throw user-friendly error for database connection issues', async () => {
      const dbError = new Error('DATABASE_URL is not configured');
      mockGenerateObject.mockRejectedValue(dbError);

      await expect(
        createTodos({
          prompt: 'Test prompt',
        })
      ).rejects.toThrow('Unable to connect to the analysis service. Please try again later.');
    });

    it('should throw user-friendly error for other unexpected errors', async () => {
      mockGenerateObject.mockRejectedValue(new Error('Unexpected error'));

      await expect(
        createTodos({
          prompt: 'Test prompt',
        })
      ).rejects.toThrow('Unable to create the analysis plan. Please try again or rephrase your request.');
    });

    it('should handle non-Error objects being thrown', async () => {
      mockGenerateObject.mockRejectedValue('String error');

      await expect(
        createTodos({
          prompt: 'Test prompt',
        })
      ).rejects.toThrow('Unable to create the analysis plan. Please try again or rephrase your request.');
    });
  });

  describe('edge cases', () => {
    it('should handle empty prompt', async () => {
      mockGenerateObject.mockResolvedValue({
        object: { todos: '' },
      });

      const result = await createTodos({
        prompt: '',
      });

      expect(result.todos).toBe('');
      expect(mockGenerateObject).toHaveBeenCalled();
    });

    it('should handle very long prompts', async () => {
      const longPrompt = 'x'.repeat(10000);
      mockGenerateObject.mockResolvedValue({
        object: { todos: '[ ] Process long prompt' },
      });

      const result = await createTodos({
        prompt: longPrompt,
      });

      expect(result.todos).toBeDefined();
    });

    it('should handle empty conversation history array', async () => {
      const result = await createTodos({
        prompt: 'Test',
        conversationHistory: [],
      });

      expect(result.todos).toBeDefined();
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
      const result = await createTodos({
        prompt: 'Test',
        conversationHistory: undefined,
      });

      expect(result.todos).toBeDefined();
      expect(mockGenerateObject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user', content: 'Test' }),
          ]),
        })
      );
    });

    it('should handle special characters in todos', async () => {
      const specialTodos = '[ ] Handle & process | special (characters) [brackets]';
      mockGenerateObject.mockResolvedValue({
        object: { todos: specialTodos },
      });

      const result = await createTodos({
        prompt: 'Special character query',
      });

      expect(result.todos).toBe(specialTodos);
    });

    it('should handle todos with markdown formatting', async () => {
      const markdownTodos = `[ ] **Bold** todo item
[ ] _Italic_ todo item
[ ] \`Code\` todo item
[ ] Todo with [link](https://example.com)`;

      mockGenerateObject.mockResolvedValue({
        object: { todos: markdownTodos },
      });

      const result = await createTodos({
        prompt: 'Markdown query',
      });

      expect(result.todos).toBe(markdownTodos);
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent todo generations', async () => {
      mockGenerateObject.mockResolvedValue({
        object: { todos: '[ ] Concurrent todo' },
      });

      const promises = Array.from({ length: 5 }, (_, i) =>
        createTodos({
          prompt: `Prompt ${i}`,
        })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result.todos).toBeDefined();
      });
      expect(mockGenerateObject).toHaveBeenCalledTimes(5);
    });

    it('should handle mixed success and failure in concurrent requests', async () => {
      mockGenerateObject
        .mockResolvedValueOnce({ object: { todos: '[ ] Success 1' } })
        .mockRejectedValueOnce(new Error('Failure'))
        .mockResolvedValueOnce({ object: { todos: '[ ] Success 2' } });

      const promises = [
        createTodos({ prompt: 'Query 1' }),
        createTodos({ prompt: 'Query 2' }).catch(() => ({ todos: '' })),
        createTodos({ prompt: 'Query 3' }),
      ];

      const results = await Promise.all(promises);

      expect(results[0].todos).toBe('[ ] Success 1');
      expect(results[1].todos).toBe('');
      expect(results[2].todos).toBe('[ ] Success 2');
    });
  });

  describe('LLM response validation', () => {
    it('should handle malformed LLM response', async () => {
      mockGenerateObject.mockResolvedValue({
        object: { wrongField: 'test' }, // Missing 'todos' field
      });

      const result = await createTodos({
        prompt: 'Test malformed response',
      });

      expect(result.todos).toBe('');
    });

    it('should handle LLM returning non-string todos', async () => {
      mockGenerateObject.mockResolvedValue({
        object: { todos: 123 }, // Number instead of string
      });

      const result = await createTodos({
        prompt: 'Test non-string todos',
      });

      // Should handle gracefully, likely converting to empty string
      expect(result.todos).toBeDefined();
    });

    it('should handle LLM timeout gracefully', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockGenerateObject.mockRejectedValue(timeoutError);

      await expect(
        createTodos({
          prompt: 'Test timeout',
        })
      ).rejects.toThrow('Unable to create the analysis plan');
    });
  });

  describe('prompt context preservation', () => {
    it('should preserve exact prompt content', async () => {
      const exactPrompt = '  Prompt with   spaces   and\nnewlines\t tabs  ';

      await createTodos({
        prompt: exactPrompt,
      });

      expect(mockGenerateObject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: exactPrompt,
            }),
          ]),
        })
      );
    });

    it('should maintain conversation history order', async () => {
      const history: ModelMessage[] = [
        { role: 'user', content: 'First' },
        { role: 'assistant', content: 'Second' },
        { role: 'user', content: 'Third' },
        { role: 'assistant', content: 'Fourth' },
      ];

      await createTodos({
        prompt: 'Current',
        conversationHistory: history,
      });

      const callArgs = mockGenerateObject.mock.calls[0][0];
      const messages = callArgs.messages;

      // Should be: system, First, Second, Third, Fourth, Current
      expect(messages[1].content).toBe('First');
      expect(messages[2].content).toBe('Second');
      expect(messages[3].content).toBe('Third');
      expect(messages[4].content).toBe('Fourth');
      expect(messages[5].content).toBe('Current');
    });
  });
});