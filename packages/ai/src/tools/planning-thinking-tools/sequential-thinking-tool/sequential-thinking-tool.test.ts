import { describe, expect, test, vi } from 'vitest';
import type { SequentialThinkingContext } from './sequential-thinking-tool';
import { createSequentialThinkingTool } from './sequential-thinking-tool';

vi.mock('braintrust', () => ({
  wrapTraced: vi.fn((fn: unknown) => fn),
}));

vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn().mockResolvedValue({ success: true }),
}));

describe('Sequential Thinking Tool', () => {
  describe('createSequentialThinkingTool', () => {
    test('should create tool with correct schema and description', () => {
      const context: SequentialThinkingContext = {
        messageId: 'test-message-123',
      };

      const tool = createSequentialThinkingTool(context);

      expect(tool.description).toContain(
        'detailed tool for dynamic and reflective problem-solving'
      );
      expect(tool.description).toContain('When to use this tool');
      expect(tool.description).toContain('Key features');
      expect(tool.inputSchema).toBeDefined();
      expect(tool.outputSchema).toBeDefined();
    });

    test('should execute successfully with valid input', async () => {
      const context: SequentialThinkingContext = {
        messageId: 'test-message-123',
      };

      const tool = createSequentialThinkingTool(context);

      const result = await tool.execute({
        thought: 'Let me think through this problem step by step',
        nextThoughtNeeded: true,
        thoughtNumber: 1,
      });

      expect(result).toEqual({ success: true });
    });

    test('should handle execution without messageId', async () => {
      const context: SequentialThinkingContext = {};

      const tool = createSequentialThinkingTool(context);

      const result = await tool.execute({
        thought: 'Thinking without message context',
        nextThoughtNeeded: false,
        thoughtNumber: 1,
      });

      expect(result).toEqual({ success: true });
    });

    test('should have required streaming callbacks', () => {
      const context: SequentialThinkingContext = {
        messageId: 'test-message-123',
      };

      const tool = createSequentialThinkingTool(context);

      expect(tool.onInputStart).toBeDefined();
      expect(tool.onInputDelta).toBeDefined();
      expect(tool.onInputAvailable).toBeDefined();
    });

    test('should validate input schema', () => {
      const context: SequentialThinkingContext = {
        messageId: 'test-message-123',
      };

      const tool = createSequentialThinkingTool(context);

      const validInput = {
        thought: 'Valid thought',
        nextThoughtNeeded: true,
        thoughtNumber: 1,
      };

      const parseResult = tool.inputSchema.safeParse(validInput);
      expect(parseResult.success).toBe(true);

      const invalidInput = {
        thought: '', // Empty string should fail min(1)
        nextThoughtNeeded: true,
        thoughtNumber: 1,
      };

      const invalidParseResult = tool.inputSchema.safeParse(invalidInput);
      expect(invalidParseResult.success).toBe(false);
    });

    test('should validate thought number is positive integer', () => {
      const context: SequentialThinkingContext = {
        messageId: 'test-message-123',
      };

      const tool = createSequentialThinkingTool(context);

      const negativeNumberInput = {
        thought: 'Valid thought',
        nextThoughtNeeded: true,
        thoughtNumber: -1,
      };

      const negativeParseResult = tool.inputSchema.safeParse(negativeNumberInput);
      expect(negativeParseResult.success).toBe(false);

      const zeroNumberInput = {
        thought: 'Valid thought',
        nextThoughtNeeded: true,
        thoughtNumber: 0,
      };

      const zeroParseResult = tool.inputSchema.safeParse(zeroNumberInput);
      expect(zeroParseResult.success).toBe(false);

      const floatNumberInput = {
        thought: 'Valid thought',
        nextThoughtNeeded: true,
        thoughtNumber: 1.5,
      };

      const floatParseResult = tool.inputSchema.safeParse(floatNumberInput);
      expect(floatParseResult.success).toBe(false);
    });
  });
});
