import { RuntimeContext } from '@mastra/core/runtime-context';
import { beforeEach, describe, expect, it } from 'vitest';
import type { DocsAgentContext } from '../../../context/docs-agent-context';
import { updateClarificationsFile } from './update-clarifications-file-tool';

describe('updateClarificationsFile', () => {
  let runtimeContext: RuntimeContext<DocsAgentContext>;

  beforeEach(() => {
    runtimeContext = new RuntimeContext<DocsAgentContext>();
  });

  it('should add a clarification question successfully', async () => {
    const result = await updateClarificationsFile.execute({
      context: {
        issue: 'Database connection configuration',
        context:
          'The user mentioned they need to connect to a database but did not specify which type',
        clarificationQuestion:
          'Which type of database are you using? (PostgreSQL, MySQL, MongoDB, etc.)',
      },
      runtimeContext,
    });

    expect(result.success).toBe(true);
    expect(result.clarification).toEqual({
      issue: 'Database connection configuration',
      context:
        'The user mentioned they need to connect to a database but did not specify which type',
      clarificationQuestion:
        'Which type of database are you using? (PostgreSQL, MySQL, MongoDB, etc.)',
    });
    expect(result.message).toBe('Successfully added clarification question');

    // Verify context was updated
    const savedClarification = runtimeContext.get('clarificationQuestion');
    expect(savedClarification).toEqual(result.clarification);
  });

  it('should overwrite previous clarification when adding new one', async () => {
    // Add first clarification
    await updateClarificationsFile.execute({
      context: {
        issue: 'First issue',
        context: 'First context',
        clarificationQuestion: 'First question?',
      },
      runtimeContext,
    });

    // Add second clarification
    const result = await updateClarificationsFile.execute({
      context: {
        issue: 'Second issue',
        context: 'Second context',
        clarificationQuestion: 'Second question?',
      },
      runtimeContext,
    });

    expect(result.success).toBe(true);
    expect(result.clarification).toEqual({
      issue: 'Second issue',
      context: 'Second context',
      clarificationQuestion: 'Second question?',
    });

    // Verify only the second clarification is stored
    const savedClarification = runtimeContext.get('clarificationQuestion');
    expect(savedClarification).toEqual(result.clarification);
  });

  it('should handle very long clarification content', async () => {
    const longText = 'A'.repeat(1000);

    const result = await updateClarificationsFile.execute({
      context: {
        issue: longText,
        context: longText,
        clarificationQuestion: `${longText}?`,
      },
      runtimeContext,
    });

    expect(result.success).toBe(true);
    expect(result.clarification?.issue).toBe(longText);
    expect(result.clarification?.context).toBe(longText);
    expect(result.clarification?.clarificationQuestion).toBe(`${longText}?`);
  });

  it('should validate input schema', () => {
    const validInput = {
      issue: 'Test issue',
      context: 'Test context',
      clarificationQuestion: 'Test question?',
    };
    const parsed = updateClarificationsFile.inputSchema.parse(validInput);
    expect(parsed).toEqual(validInput);

    // Missing required fields
    expect(() => {
      updateClarificationsFile.inputSchema.parse({
        issue: 'Test issue',
        context: 'Test context',
      });
    }).toThrow();

    expect(() => {
      updateClarificationsFile.inputSchema.parse({
        issue: 'Test issue',
        clarificationQuestion: 'Test question?',
      });
    }).toThrow();

    expect(() => {
      updateClarificationsFile.inputSchema.parse({
        context: 'Test context',
        clarificationQuestion: 'Test question?',
      });
    }).toThrow();

    // Wrong types
    expect(() => {
      updateClarificationsFile.inputSchema.parse({
        issue: 123,
        context: 'Test context',
        clarificationQuestion: 'Test question?',
      });
    }).toThrow();
  });

  it('should validate output schema', () => {
    const validOutput = {
      success: true,
      clarification: {
        issue: 'Test issue',
        context: 'Test context',
        clarificationQuestion: 'Test question?',
      },
      message: 'Success',
    };
    const parsed = updateClarificationsFile.outputSchema.parse(validOutput);
    expect(parsed).toEqual(validOutput);

    const minimalOutput = {
      success: false,
    };
    const minimalParsed = updateClarificationsFile.outputSchema.parse(minimalOutput);
    expect(minimalParsed).toEqual(minimalOutput);
  });

  it('should handle empty strings', async () => {
    const result = await updateClarificationsFile.execute({
      context: {
        issue: '',
        context: '',
        clarificationQuestion: '',
      },
      runtimeContext,
    });

    expect(result.success).toBe(true);
    expect(result.clarification).toEqual({
      issue: '',
      context: '',
      clarificationQuestion: '',
    });
  });

  it('should handle special characters in clarification content', async () => {
    const result = await updateClarificationsFile.execute({
      context: {
        issue: 'Issue with "quotes" and \'apostrophes\'',
        context: 'Context with\nnewlines\tand\ttabs',
        clarificationQuestion: 'Question with émojis 🤔 and special chars: <>?/@#$%',
      },
      runtimeContext,
    });

    expect(result.success).toBe(true);
    expect(result.clarification).toEqual({
      issue: 'Issue with "quotes" and \'apostrophes\'',
      context: 'Context with\nnewlines\tand\ttabs',
      clarificationQuestion: 'Question with émojis 🤔 and special chars: <>?/@#$%',
    });
  });
});
