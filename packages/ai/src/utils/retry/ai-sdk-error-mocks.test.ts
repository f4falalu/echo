import {
  APICallError,
  EmptyResponseBodyError,
  InvalidArgumentError,
  InvalidDataContentError,
  InvalidMessageRoleError,
  InvalidPromptError,
  InvalidResponseDataError,
  InvalidToolArgumentsError,
  JSONParseError,
  LoadAPIKeyError,
  NoContentGeneratedError,
  NoSuchModelError,
  NoSuchProviderError,
  NoSuchToolError,
  RetryError,
  ToolExecutionError,
  TypeValidationError,
  UnsupportedFunctionalityError,
} from 'ai';
import { describe, expect, it, vi } from 'vitest';
import { detectRetryableError } from './retry-agent-stream';
import { RetryWithHealingError } from './retry-error';
import {
  createRetryOnErrorHandler,
  createUserFriendlyErrorMessage,
  extractDetailedErrorMessage,
} from './retry-helpers';
import type { WorkflowContext } from './types';

describe('AI SDK Error Mocks - Comprehensive Error Handling', () => {
  describe('API Call Errors', () => {
    it('should handle APICallError with 429 rate limit', async () => {
      const error = new APICallError({
        message: 'Rate limit exceeded',
        statusCode: 429,
        responseHeaders: {
          'retry-after': '60',
        },
        responseBody: 'Too many requests',
        url: 'https://api.openai.com/v1/chat/completions',
        requestBodyValues: {
          model: 'gpt-4',
          messages: [{ role: 'user', content: 'Hello' }],
        },
        cause: undefined,
        isRetryable: true,
      });

      const context: WorkflowContext = { currentStep: 'analyst' };
      const retryableError = detectRetryableError(error, context);

      expect(retryableError).not.toBeNull();
      expect(retryableError?.type).toBe('rate-limit');
      expect(retryableError?.healingMessage.content).toContain('Please wait 60 seconds');
    });

    it('should handle APICallError with 503 service unavailable', async () => {
      const error = new APICallError({
        message: 'Service unavailable',
        statusCode: 503,
        responseHeaders: {},
        responseBody: 'Service temporarily unavailable',
        url: 'https://api.anthropic.com/v1/messages',
        requestBodyValues: {},
        cause: undefined,
        isRetryable: true,
      });

      const context: WorkflowContext = { currentStep: 'think-and-prep' };
      const retryableError = detectRetryableError(error, context);

      expect(retryableError).not.toBeNull();
      expect(retryableError?.type).toBe('server-error');
      expect(retryableError?.healingMessage.content).toContain('temporarily unavailable');
    });

    it('should handle APICallError with network timeout', async () => {
      const error = new APICallError({
        message: 'Network request failed',
        statusCode: undefined,
        responseHeaders: {},
        responseBody: undefined,
        url: 'https://api.openai.com/v1/chat/completions',
        requestBodyValues: {},
        cause: new Error('ETIMEDOUT'),
        isRetryable: true,
      });

      const retryableError = detectRetryableError(error);

      expect(retryableError).not.toBeNull();
      expect(retryableError?.type).toBe('network-timeout');
      expect(retryableError?.healingMessage.content).toContain('Network connection error');
    });

    it('should handle onError callback with APICallError', async () => {
      const handler = createRetryOnErrorHandler({
        retryCount: 1,
        maxRetries: 5,
        workflowContext: { currentStep: 'analyst' },
      });

      const error = new APICallError({
        message: 'Internal server error',
        statusCode: 500,
        responseHeaders: {},
        responseBody: 'Server error',
        url: 'https://api.example.com',
        requestBodyValues: {},
        cause: undefined,
        isRetryable: true,
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      await expect(handler({ error })).rejects.toThrow(RetryWithHealingError);

      consoleErrorSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });
  });

  describe('Tool-Related Errors', () => {
    it('should handle NoSuchToolError with available tools', () => {
      const error = new NoSuchToolError({
        toolName: 'createMetrics',
        availableTools: ['sequentialThinking', 'executeSql', 'submitThoughts'],
      });

      const context: WorkflowContext = { currentStep: 'think-and-prep' };
      const retryableError = detectRetryableError(error, context);

      expect(retryableError).not.toBeNull();
      expect(retryableError?.type).toBe('no-such-tool');
      expect(retryableError?.healingMessage.role).toBe('tool');
      expect(retryableError?.healingMessage.content[0]).toMatchObject({
        type: 'tool-result',
        toolName: 'createMetrics',
        result: {
          error: expect.stringContaining('Tool "createMetrics" is not available'),
        },
      });
    });

    it('should handle InvalidToolArgumentsError with Zod validation', () => {
      const error = new InvalidToolArgumentsError({
        toolName: 'executeSql',
        toolCallId: 'call_123',
        args: { query: 123 }, // Wrong type
        cause: {
          errors: [{ path: ['query'], message: 'Expected string, received number' }],
        },
      });

      // Cast to Error with name property for detection
      (error as any).name = 'AI_InvalidToolArgumentsError';
      (error as any).toolCallId = 'call_123'; // Ensure toolCallId is accessible

      const retryableError = detectRetryableError(error);

      expect(retryableError).not.toBeNull();
      expect(retryableError?.type).toBe('invalid-tool-arguments');
      expect(retryableError?.healingMessage.content[0]).toMatchObject({
        type: 'tool-result',
        toolCallId: 'call_123',
        toolName: 'executeSql',
        result: {
          error: expect.stringContaining('query: Expected string, received number'),
        },
      });
    });

    it('should handle ToolExecutionError', () => {
      const error = new ToolExecutionError({
        toolName: 'readFile',
        toolCallId: 'call_456',
        message: 'File not found',
        cause: new Error('ENOENT: no such file or directory'),
      });

      const retryableError = detectRetryableError(error);

      expect(retryableError).not.toBeNull();
      expect(retryableError?.type).toBe('invalid-tool-arguments');
      expect(retryableError?.healingMessage.content[0]).toMatchObject({
        type: 'tool-result',
        toolCallId: 'call_456',
        toolName: 'readFile',
        result: {
          error: expect.stringContaining('Tool execution failed'),
        },
      });
    });
  });

  describe('Response and Parsing Errors', () => {
    it('should handle EmptyResponseBodyError', () => {
      const error = new EmptyResponseBodyError({
        message: 'Empty response body',
      });

      const retryableError = detectRetryableError(error);

      expect(retryableError).not.toBeNull();
      expect(retryableError?.type).toBe('empty-response');
      expect(retryableError?.healingMessage.content).toBe('Please continue.');
    });

    it('should handle JSONParseError', () => {
      const error = new JSONParseError({
        message: 'Invalid JSON',
        text: '{"incomplete": ',
        cause: new SyntaxError('Unexpected end of JSON input'),
      });

      const retryableError = detectRetryableError(error);

      expect(retryableError).not.toBeNull();
      expect(retryableError?.type).toBe('json-parse-error');
      expect(retryableError?.healingMessage.content).toContain('issue with the response format');
    });

    it('should handle NoContentGeneratedError', () => {
      const error = new NoContentGeneratedError({
        message: 'No content generated',
      });

      const retryableError = detectRetryableError(error);

      expect(retryableError).not.toBeNull();
      expect(retryableError?.type).toBe('empty-response');
      expect(retryableError?.healingMessage.content).toBe('Please continue.');
    });

    it('should handle InvalidResponseDataError', () => {
      const error = new InvalidResponseDataError({
        message: 'Invalid response data',
        data: { unexpected: 'format' },
      });

      const detailedMessage = extractDetailedErrorMessage(error);
      expect(detailedMessage).toContain('Invalid response data');
    });
  });

  describe('Validation Errors', () => {
    it('should handle InvalidArgumentError', () => {
      const error = new InvalidArgumentError({
        argument: 'messages',
        message: 'Messages cannot be empty',
      });

      const detailedMessage = extractDetailedErrorMessage(error);
      expect(detailedMessage).toContain('Messages cannot be empty');
    });

    it('should handle InvalidDataContentError', () => {
      const error = new InvalidDataContentError({
        message: 'Invalid data content',
        content: { type: 'unknown' },
      });

      const detailedMessage = extractDetailedErrorMessage(error);
      expect(detailedMessage).toContain('Invalid data content');
    });

    it('should handle InvalidMessageRoleError', () => {
      const error = new InvalidMessageRoleError({
        message: "Invalid role 'bot'",
        role: 'bot',
      });

      const detailedMessage = extractDetailedErrorMessage(error);
      expect(detailedMessage).toContain("Invalid role 'bot'");
    });

    it('should handle InvalidPromptError', () => {
      const error = new InvalidPromptError({
        message: 'Prompt is required',
        prompt: '',
      });

      const detailedMessage = extractDetailedErrorMessage(error);
      expect(detailedMessage).toContain('Prompt is required');
    });

    it('should handle TypeValidationError', () => {
      const error = new TypeValidationError({
        message: 'Type validation failed',
        value: { invalid: true },
      });

      const detailedMessage = extractDetailedErrorMessage(error);
      expect(detailedMessage).toContain('Type validation failed');
    });
  });

  describe('Configuration Errors (Non-Retryable)', () => {
    it('should NOT retry LoadAPIKeyError', () => {
      const error = new LoadAPIKeyError({
        message: 'API key not found',
      });
      (error as any).name = 'AI_LoadAPIKeyError';

      const retryableError = detectRetryableError(error);
      expect(retryableError).toBeNull();
    });

    it('should NOT retry LoadSettingError', () => {
      // Create a mock error with the expected name
      const error = new Error('Setting not found');
      (error as any).name = 'AI_LoadSettingError';
      (error as any).setting = 'baseURL';

      const retryableError = detectRetryableError(error);
      expect(retryableError).toBeNull();
    });

    it('should NOT retry NoSuchModelError', () => {
      const error = new NoSuchModelError({
        message: 'Model not found',
        modelId: 'gpt-5',
        modelType: 'languageModel',
      });
      (error as any).name = 'AI_NoSuchModelError';

      const retryableError = detectRetryableError(error);
      expect(retryableError).toBeNull();
    });

    it('should NOT retry NoSuchProviderError', () => {
      const error = new NoSuchProviderError({
        message: 'Provider not found',
        providerId: 'unknown-provider',
        availableProviders: ['openai', 'anthropic'],
      });
      (error as any).name = 'AI_NoSuchProviderError';

      const retryableError = detectRetryableError(error);
      expect(retryableError).toBeNull();
    });

    it('should NOT retry UnsupportedFunctionalityError', () => {
      const error = new UnsupportedFunctionalityError({
        message: 'Functionality not supported',
        functionality: 'streaming',
      });
      (error as any).name = 'AI_UnsupportedFunctionalityError';

      const retryableError = detectRetryableError(error);
      expect(retryableError).toBeNull();
    });

    it('should NOT retry TooManyEmbeddingValuesForCallError', () => {
      // Create a mock error with the expected name
      const error = new Error('Too many embedding values');
      (error as any).name = 'AI_TooManyEmbeddingValuesForCallError';
      (error as any).modelId = 'text-embedding-ada-002';
      (error as any).provider = 'openai';
      (error as any).numValues = 10000;

      const retryableError = detectRetryableError(error);
      expect(retryableError).toBeNull();
    });
  });

  describe('Complex Error Scenarios', () => {
    it('should handle RetryError with nested error', () => {
      const nestedError = new APICallError({
        message: 'Service unavailable',
        statusCode: 503,
        responseHeaders: {},
        responseBody: 'Service down',
        url: 'https://api.example.com',
        requestBodyValues: {},
        cause: undefined,
        isRetryable: true,
      });

      const error = new RetryError({
        message: 'Failed after 3 retries',
        reason: 'maxRetriesExceeded',
        errors: [nestedError, nestedError, nestedError],
        lastError: nestedError,
      });

      const retryableError = detectRetryableError(error);

      expect(retryableError).not.toBeNull();
      expect(retryableError?.type).toBe('server-error');
    });

    it('should handle InvalidModelIdError', () => {
      // Create a mock error since InvalidModelIdError might not be exported
      const error = new Error('Invalid model ID format');
      (error as any).modelId = 'invalid@model#id';

      const detailedMessage = extractDetailedErrorMessage(error);
      expect(detailedMessage).toContain('Invalid model ID format');
    });

    it('should handle generic "No tool calls generated" error', () => {
      const error = new Error('No tool calls generated');

      const retryableError = detectRetryableError(error);

      expect(retryableError).not.toBeNull();
      expect(retryableError?.type).toBe('empty-response');
      expect(retryableError?.healingMessage.content).toBe('Please continue.');
    });

    it('should handle unknown errors with stack trace', () => {
      const error = new Error('Unknown error occurred');
      error.stack = `Error: Unknown error occurred
    at Object.<anonymous> (/path/to/file.js:10:15)
    at Module._compile (node:internal/modules/cjs/loader:1126:14)`;

      const context: WorkflowContext = { currentStep: 'analyst' };
      const retryableError = detectRetryableError(error, context);

      expect(retryableError).not.toBeNull();
      expect(retryableError?.type).toBe('unknown-error');
      expect(retryableError?.healingMessage.content).toContain('Unknown error occurred');
      expect(retryableError?.healingMessage.content).toContain('at Object.<anonymous>');
    });
  });

  describe('User-Friendly Error Messages', () => {
    it('should create user-friendly message for database errors', () => {
      const error = new Error('Cannot connect to DATABASE_URL');
      const message = createUserFriendlyErrorMessage(error);
      expect(message).toBe('Unable to connect to the analysis service. Please try again later.');
    });

    it('should create user-friendly message for API errors', () => {
      const error = new Error('API request failed');
      const message = createUserFriendlyErrorMessage(error);
      expect(message).toBe(
        'The analysis service is temporarily unavailable. Please try again in a few moments.'
      );
    });

    it('should create user-friendly message for model errors', () => {
      const error = new Error('model not found');
      const message = createUserFriendlyErrorMessage(error);
      expect(message).toBe(
        'The analysis service is temporarily unavailable. Please try again in a few moments.'
      );
    });

    it('should create generic message for unknown errors', () => {
      const error = new Error('Something went wrong');
      const message = createUserFriendlyErrorMessage(error);
      expect(message).toBe(
        'Something went wrong during the analysis. Please try again or contact support if the issue persists.'
      );
    });
  });

  describe('Complete onError Handler Flow', () => {
    it('should handle full retry flow with healing', async () => {
      const handler = createRetryOnErrorHandler({
        retryCount: 2,
        maxRetries: 5,
        workflowContext: { currentStep: 'analyst' },
      });

      const error = new NoSuchToolError({
        toolName: 'invalidTool',
        availableTools: ['tool1', 'tool2'],
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      let thrownError: any;
      try {
        await handler({ error });
      } catch (e) {
        thrownError = e;
      }

      expect(thrownError).toBeInstanceOf(RetryWithHealingError);
      expect(thrownError.retryableError.type).toBe('no-such-tool');
      expect(thrownError.retryableError.healingMessage.content[0].result.error).toContain(
        'Tool "invalidTool" is not available'
      );

      consoleErrorSpy.mockRestore();
      consoleInfoSpy.mockRestore();
    });
  });
});
