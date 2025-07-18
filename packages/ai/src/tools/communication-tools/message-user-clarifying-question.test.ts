import { describe, expect, test } from 'vitest';
import messageUserClarifyingQuestion from './message-user-clarifying-question';

describe('Message User Clarifying Question Tool Unit Tests', () => {
  test('should have correct configuration', () => {
    expect(messageUserClarifyingQuestion.id).toBe('message-user-clarifying-question');
    expect(messageUserClarifyingQuestion.description).toContain(
      'Ask the user a clarifying question when additional information is needed'
    );
    expect(messageUserClarifyingQuestion.inputSchema).toBeDefined();
    expect(messageUserClarifyingQuestion.outputSchema).toBeDefined();
    expect(messageUserClarifyingQuestion.execute).toBeDefined();
  });

  test('should validate input schema', () => {
    const validInput = {
      clarifying_question: 'Which time period would you like to analyze?',
    };
    const result = messageUserClarifyingQuestion.inputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  test('should validate output schema structure', () => {
    const validOutput = {};

    const result = messageUserClarifyingQuestion.outputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  test('should execute with clarifying question', async () => {
    const result = await messageUserClarifyingQuestion.execute({
      context: {
        clarifying_question: 'Which time period would you like to analyze?',
      },
    });

    expect(result).toEqual({});
  });

  test('should require minimum length for clarifying question', () => {
    const invalidInput = {
      clarifying_question: '',
    };
    const result = messageUserClarifyingQuestion.inputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  test('should execute successfully with valid question', async () => {
    const result = await messageUserClarifyingQuestion.execute({
      context: {
        clarifying_question: '## Which metric would you like to focus on?\n\n- Revenue: Total sales revenue\n- Profit: Net profit after costs\n- Volume: Number of units sold',
      },
    });

    expect(result).toEqual({});
  });
});

describe.skip('Process Clarification Response Tool Tests', () => {
  test('should have correct configuration', () => {
    expect(processClarificationResponseTool.id).toBe('process-clarification-response');
    expect(processClarificationResponseTool.description).toBe(
      'Process user response to a clarifying question'
    );
  });

  test('should validate input schema', () => {
    const validInput = {
      response: 'Yes, include historical data',
      question_id: 'clarify_123',
    };
    const result = processClarificationResponseTool.inputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  test('should process valid yes/no response', async () => {
    // First ask a yes/no question
    await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'Should I include historical data?',
        question_type: 'yes_no',
      },
    });

    // Then process the response
    const result = await processClarificationResponseTool.execute({
      context: { response: 'Yes' },
    });

    expect(result.success).toBe(true);
    expect(result.response_processed).toBe(true);
    expect(result.workflow_resumed).toBe(true);
    expect(result.validation_result?.valid).toBe(true);
  });

  test('should reject invalid yes/no response', async () => {
    // First ask a yes/no question
    await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'Should I proceed?',
        question_type: 'yes_no',
      },
    });

    // Then process invalid response
    const result = await processClarificationResponseTool.execute({
      context: { response: 'Maybe' },
    });

    expect(result.success).toBe(false);
    expect(result.response_processed).toBe(false);
    expect(result.workflow_resumed).toBe(false);
    expect(result.validation_result?.valid).toBe(false);
    expect(result.validation_result?.error_message).toContain('Yes or No');
  });

  test('should process valid confirmation response', async () => {
    // First ask a confirmation question
    await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'Please confirm the data deletion',
        question_type: 'confirmation',
      },
    });

    // Then process confirmation
    const result = await processClarificationResponseTool.execute({
      context: { response: 'Confirm' },
    });

    expect(result.success).toBe(true);
    expect(result.validation_result?.valid).toBe(true);
  });

  test('should reject invalid confirmation response', async () => {
    // First ask a confirmation question
    await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'Please confirm the action',
        question_type: 'confirmation',
      },
    });

    // Then process short/invalid response
    const result = await processClarificationResponseTool.execute({
      context: { response: 'ok' },
    });

    expect(result.success).toBe(false);
    expect(result.validation_result?.error_message).toContain('Confirm');
  });

  test('should process open-ended responses', async () => {
    // First ask an open-ended question
    await messageUserClarifyingQuestionTool.execute({
      context: {
        question: 'What time period would you like?',
        question_type: 'open_ended',
      },
    });

    // Then process any response (open-ended doesn't validate)
    const result = await processClarificationResponseTool.execute({
      context: { response: 'Last 3 months' },
    });

    expect(result.success).toBe(true);
    expect(result.validation_result?.valid).toBe(true);
  });

  test('should handle no pending clarification request', async () => {
    // Try to process response without asking question first
    const result = await processClarificationResponseTool.execute({
      context: { response: 'Some response' },
    });

    // The tool may handle this gracefully rather than throwing
    expect(result.success).toBe(true);
    expect(result.response_processed).toBe(true);
  });
});

describe.skip('Should Ask Clarification Helper Tests', () => {
  test('should ask clarification for high ambiguity', () => {
    const result = shouldAskClarification({
      ambiguity_score: 0.8,
      missing_requirements: [],
      confidence_level: 0.7,
    });

    expect(result).toBe(true);
  });

  test('should ask clarification for missing requirements', () => {
    const result = shouldAskClarification({
      ambiguity_score: 0.3,
      missing_requirements: ['time_period', 'metrics'],
      confidence_level: 0.7,
    });

    expect(result).toBe(true);
  });

  test('should ask clarification for low confidence', () => {
    const result = shouldAskClarification({
      ambiguity_score: 0.3,
      missing_requirements: [],
      confidence_level: 0.4,
    });

    expect(result).toBe(true);
  });

  test('should not ask clarification when all conditions are good', () => {
    const result = shouldAskClarification({
      ambiguity_score: 0.2,
      missing_requirements: [],
      confidence_level: 0.8,
    });

    expect(result).toBe(false);
  });

  test('should ask clarification when multiple conditions are borderline', () => {
    const result = shouldAskClarification({
      ambiguity_score: 0.6,
      missing_requirements: ['time_period'],
      confidence_level: 0.6,
    });

    expect(result).toBe(true);
  });
});
