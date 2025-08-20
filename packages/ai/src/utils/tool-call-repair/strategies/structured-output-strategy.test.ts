import { InvalidToolInputError } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import type { RepairContext } from '../types';
import { StructuredOutputStrategy } from './structured-output-strategy';

// Mock the dependencies
vi.mock('ai', async () => {
  const actual = await vi.importActual('ai');
  return {
    ...actual,
    generateObject: vi.fn(),
  };
});

vi.mock('braintrust', () => ({
  wrapTraced: (fn: any) => fn,
}));

vi.mock('../../../llm', () => ({
  Sonnet4: 'mock-model',
}));

describe('StructuredOutputStrategy', () => {
  const strategy = new StructuredOutputStrategy();

  describe('canHandle', () => {
    it('should return true for InvalidToolInputError', () => {
      const error = new InvalidToolInputError({
        toolName: 'testTool',
        toolInput: 'invalid input',
        cause: new Error('validation failed'),
      });
      expect(strategy.canHandle(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = new Error('Some other error');
      expect(strategy.canHandle(error)).toBe(false);
    });
  });

  describe('repair', () => {
    it('should repair tool arguments using structured output', async () => {
      const { generateObject } = await import('ai');
      const mockGenerateObject = vi.mocked(generateObject);

      const repairedInput = { field1: 'value1', field2: 123 };
      mockGenerateObject.mockResolvedValueOnce({
        object: repairedInput,
        warnings: [],
        usage: {},
      } as any);

      const context: RepairContext = {
        toolCall: {
          toolCallType: 'function',
          toolCallId: 'call123',
          toolName: 'testTool',
          input: { field1: 'invalid', field2: 'not-a-number' },
        } as any,
        tools: {
          testTool: {
            inputSchema: {
              type: 'object',
              properties: {
                field1: { type: 'string' },
                field2: { type: 'number' },
              },
            },
          },
        } as any,
        error: new InvalidToolInputError({
          toolName: 'testTool',
          toolInput: 'invalid',
          cause: new Error('validation failed'),
        }),
        messages: [],
        system: '',
      };

      const result = await strategy.repair(context);

      expect(result).toEqual({
        toolCallType: 'function',
        toolCallId: 'call123',
        toolName: 'testTool',
        input: repairedInput,
      });

      const tool = context.tools.testTool as any;
      expect(mockGenerateObject).toHaveBeenCalledWith({
        model: 'mock-model',
        schema: tool?.inputSchema,
        prompt: expect.stringContaining('Please fix the arguments'),
      });
    });

    it('should return null if tool not found', async () => {
      const context: RepairContext = {
        toolCall: {
          toolCallType: 'function',
          toolCallId: 'call123',
          toolName: 'nonExistentTool',
          input: {},
        } as any,
        tools: {} as any,
        error: new InvalidToolInputError({
          toolName: 'nonExistentTool',
          toolInput: 'invalid',
          cause: new Error('validation failed'),
        }),
        messages: [],
        system: '',
      };

      const result = await strategy.repair(context);
      expect(result).toBeNull();
    });

    it('should return null if tool has no input schema', async () => {
      const context: RepairContext = {
        toolCall: {
          toolCallType: 'function',
          toolCallId: 'call123',
          toolName: 'testTool',
          input: {},
        } as any,
        tools: {
          testTool: {},
        } as any,
        error: new InvalidToolInputError({
          toolName: 'testTool',
          toolInput: 'invalid',
          cause: new Error('validation failed'),
        }),
        messages: [],
        system: '',
      };

      const result = await strategy.repair(context);
      expect(result).toBeNull();
    });

    it('should handle errors during repair', async () => {
      const { generateObject } = await import('ai');
      const mockGenerateObject = vi.mocked(generateObject);

      mockGenerateObject.mockRejectedValueOnce(new Error('Generation failed'));

      const context: RepairContext = {
        toolCall: {
          toolCallType: 'function',
          toolCallId: 'call123',
          toolName: 'testTool',
          input: {},
        } as any,
        tools: {
          testTool: {
            inputSchema: { type: 'object' },
          },
        } as any,
        error: new InvalidToolInputError({
          toolName: 'testTool',
          toolInput: 'invalid',
          cause: new Error('validation failed'),
        }),
        messages: [],
        system: '',
      };

      await expect(strategy.repair(context)).rejects.toThrow(
        'Failed to repair tool call "testTool": Generation failed'
      );
    });

    it('should handle string input that is valid JSON', async () => {
      const { generateObject } = await import('ai');
      const mockGenerateObject = vi.mocked(generateObject);

      const repairedInput = { field1: 'value1', field2: 123 };
      mockGenerateObject.mockResolvedValueOnce({
        object: repairedInput,
        warnings: [],
        usage: {},
      } as any);

      const context: RepairContext = {
        toolCall: {
          toolCallType: 'function',
          toolCallId: 'call123',
          toolName: 'testTool',
          input: '{"field1": "invalid", "field2": "not-a-number"}',
        } as any,
        tools: {
          testTool: {
            inputSchema: {
              type: 'object',
              properties: {
                field1: { type: 'string' },
                field2: { type: 'number' },
              },
            },
          },
        } as any,
        error: new InvalidToolInputError({
          toolName: 'testTool',
          toolInput: 'invalid',
          cause: new Error('validation failed'),
        }),
        messages: [],
        system: '',
      };

      const result = await strategy.repair(context);

      expect(result).toEqual({
        toolCallType: 'function',
        toolCallId: 'call123',
        toolName: 'testTool',
        input: repairedInput,
      });
    });

    it('should handle string input that is not valid JSON', async () => {
      const { generateObject } = await import('ai');
      const mockGenerateObject = vi.mocked(generateObject);

      const repairedInput = { value: 'parsed correctly' };
      mockGenerateObject.mockResolvedValueOnce({
        object: repairedInput,
        warnings: [],
        usage: {},
      } as any);

      const context: RepairContext = {
        toolCall: {
          toolCallType: 'function',
          toolCallId: 'call123',
          toolName: 'testTool',
          input: 'plain text input',
        } as any,
        tools: {
          testTool: {
            inputSchema: {
              type: 'object',
              properties: {
                value: { type: 'string' },
              },
            },
          },
        } as any,
        error: new InvalidToolInputError({
          toolName: 'testTool',
          toolInput: 'invalid',
          cause: new Error('validation failed'),
        }),
        messages: [],
        system: '',
      };

      const result = await strategy.repair(context);

      expect(result).toEqual({
        toolCallType: 'function',
        toolCallId: 'call123',
        toolName: 'testTool',
        input: repairedInput,
      });

      // Verify the prompt contains the wrapped input
      expect(mockGenerateObject).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('{"value":"plain text input"}'),
        })
      );
    });
  });
});
