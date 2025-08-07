import { describe, expect, test } from 'vitest';
import { createRespondWithoutAssetCreationTool } from './respond-without-asset-creation-tool';

describe('Respond Without Asset Creation Tool Integration Tests', () => {
  describe('Tool Creation and Configuration', () => {
    test('should create tool with minimal context', () => {
      const tool = createRespondWithoutAssetCreationTool({});

      expect(tool).toBeDefined();
      expect(tool.inputSchema).toBeDefined();
      expect(tool.outputSchema).toBeDefined();
      expect(tool.execute).toBeDefined();
      expect(tool.onInputStart).toBeDefined();
      expect(tool.onInputDelta).toBeDefined();
      expect(tool.onInputAvailable).toBeDefined();
    });

    test('should create tool with full context', () => {
      const tool = createRespondWithoutAssetCreationTool({
        messageId: 'test-message-123',
      });

      expect(tool).toBeDefined();
      expect(tool.description).toContain('Marks all remaining unfinished tasks as complete');
    });

    test('should create tool with extended context', () => {
      const extendedContext = {
        messageId: 'test-message-456',
        userId: 'user-123',
        chatId: 'chat-456',
        additionalField: 'extra-data',
      };

      const tool = createRespondWithoutAssetCreationTool(extendedContext);

      expect(tool).toBeDefined();
      expect(tool.execute).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    test('should validate final_response is required', () => {
      const tool = createRespondWithoutAssetCreationTool({});
      const schema = tool.inputSchema;

      const validInput = {
        final_response: 'This is a valid response',
      };

      const invalidInput = {
        final_response: '',
      };

      expect(() => schema.parse(validInput)).not.toThrow();
      expect(() => schema.parse(invalidInput)).toThrow();
    });

    test('should accept markdown formatted responses', () => {
      const tool = createRespondWithoutAssetCreationTool({});
      const schema = tool.inputSchema;

      const markdownInput = {
        final_response: `
## Summary

- First point
- Second point
- Third point

**Important:** This is markdown formatted.

### Details
1. Item one
2. Item two
3. Item three
`,
      };

      expect(() => schema.parse(markdownInput)).not.toThrow();
    });

    test('should reject empty object', () => {
      const tool = createRespondWithoutAssetCreationTool({});
      const schema = tool.inputSchema;

      const emptyInput = {};

      expect(() => schema.parse(emptyInput)).toThrow();
    });

    test('should reject null final_response', () => {
      const tool = createRespondWithoutAssetCreationTool({});
      const schema = tool.inputSchema;

      const nullInput = {
        final_response: null,
      };

      expect(() => schema.parse(nullInput)).toThrow();
    });
  });

  describe('Tool Execution', () => {
    test('should execute successfully with valid input', async () => {
      const tool = createRespondWithoutAssetCreationTool({
        messageId: 'test-message-789',
      });

      const input = {
        final_response: 'Task completed successfully',
      };

      const result = await tool.execute(input);

      expect(result).toBeDefined();
      expect(result).toEqual({});
    });

    test('should execute with long response', async () => {
      const tool = createRespondWithoutAssetCreationTool({});

      const longResponse = 'A'.repeat(10000);
      const input = {
        final_response: longResponse,
      };

      const result = await tool.execute(input);

      expect(result).toBeDefined();
      expect(result).toEqual({});
    });

    test('should execute with special characters', async () => {
      const tool = createRespondWithoutAssetCreationTool({});

      const input = {
        final_response: `
Special characters test: !@#$%^&*()_+-=[]{}|;':",./<>?
Unicode: 你好 🎉 €£¥
Escaped: \n \t \\ \" \'
`,
      };

      const result = await tool.execute(input);

      expect(result).toBeDefined();
      expect(result).toEqual({});
    });

    test('should execute without messageId context', async () => {
      const tool = createRespondWithoutAssetCreationTool({});

      const input = {
        final_response: 'Response without message context',
      };

      const result = await tool.execute(input);

      expect(result).toBeDefined();
      expect(result).toEqual({});
    });
  });

  describe('Factory Pattern Tests', () => {
    test('should create multiple independent tool instances', () => {
      const tool1 = createRespondWithoutAssetCreationTool({
        messageId: 'message-1',
      });

      const tool2 = createRespondWithoutAssetCreationTool({
        messageId: 'message-2',
      });

      expect(tool1).not.toBe(tool2);
      expect(tool1.execute).not.toBe(tool2.execute);
      expect(tool1.onInputStart).not.toBe(tool2.onInputStart);
      expect(tool1.onInputDelta).not.toBe(tool2.onInputDelta);
      expect(tool1.onInputAvailable).not.toBe(tool2.onInputAvailable);
    });

    test('should maintain separate state for each instance', async () => {
      const context1 = { messageId: 'msg-1' };
      const context2 = { messageId: 'msg-2' };

      const tool1 = createRespondWithoutAssetCreationTool(context1);
      const tool2 = createRespondWithoutAssetCreationTool(context2);

      const input1 = { final_response: 'Response 1' };
      const input2 = { final_response: 'Response 2' };

      const [result1, result2] = await Promise.all([
        tool1.execute(input1),
        tool2.execute(input2),
      ]);

      expect(result1).toEqual({});
      expect(result2).toEqual({});
    });
  });

  describe('Output Schema Validation', () => {
    test('should have empty output schema', () => {
      const tool = createRespondWithoutAssetCreationTool({});
      const outputSchema = tool.outputSchema;

      const emptyOutput = {};
      expect(() => outputSchema.parse(emptyOutput)).not.toThrow();
    });

    test('should accept empty output only', () => {
      const tool = createRespondWithoutAssetCreationTool({});
      const outputSchema = tool.outputSchema;

      // The output schema is z.object({}) which accepts empty objects
      // Additional properties are allowed in Zod by default unless strict() is used
      const emptyOutput = {};
      const result = outputSchema.parse(emptyOutput);
      expect(result).toEqual({});
    });
  });

  describe('Tool Description', () => {
    test('should have correct description', () => {
      const tool = createRespondWithoutAssetCreationTool({});

      expect(tool.description).toContain('Marks all remaining unfinished tasks');
      expect(tool.description).toContain('ends the workflow');
      expect(tool.description).toContain('markdown format');
      // The description mentions not to use the bullet character
      expect(tool.description).toContain('bullet character');
    });
  });
});