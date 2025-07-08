import {
  APICallError,
  EmptyResponseBodyError,
  InvalidToolArgumentsError,
  JSONParseError,
  NoContentGeneratedError,
  NoSuchToolError,
  RetryError,
  ToolExecutionError,
} from 'ai';
import type { RetryableError, WorkflowContext } from './types';

/**
 * Creates a workflow-aware healing message for NoSuchToolError
 */
function createWorkflowAwareHealingMessage(toolName: string, context?: WorkflowContext): string {
  const baseMessage = `Tool "${toolName}" is not available in the current mode.`;

  if (!context) {
    return `${baseMessage} Please use one of the available tools instead.`;
  }

  const { currentStep, availableTools } = context;

  // Use actual available tools if provided
  if (availableTools && availableTools.size > 0) {
    const toolList = Array.from(availableTools).sort().join(', ');
    return `${baseMessage}

You are currently in ${currentStep} mode. The available tools are: ${toolList}.

Please use one of these tools to continue with your task. Make sure to use the exact tool name as listed above.`;
  }

  // Fallback to static message if tools not provided
  const pipelineContext = `

This workflow has two steps:
1. think-and-prep mode: Available tools are sequentialThinking, executeSql, respondWithoutAnalysis, submitThoughts, messageUserClarifyingQuestion
2. analyst mode: Available tools are createMetrics, modifyMetrics, createDashboards, modifyDashboards, doneTool

You are currently in ${currentStep} mode. Please use one of the tools available in your current mode.

You should proceed with the proper tool calls in the context of the current step. There is a chance you might be a little confused about where you are in the workflow. or the tools available to you.`;

  return baseMessage + pipelineContext;
}

/**
 * Checks if an error should never be retried (configuration/programming errors)
 */
function isNonRetryableError(error: unknown): boolean {
  const nonRetryableErrorNames = [
    'AI_LoadAPIKeyError',
    'AI_LoadSettingError',
    'AI_NoSuchModelError',
    'AI_NoSuchProviderError',
    'AI_UnsupportedFunctionalityError',
    'AI_TooManyEmbeddingValuesForCallError',
    'AI_NoOutputSpecifiedError',
  ];

  if (error instanceof Error) {
    return nonRetryableErrorNames.includes(error.name);
  }
  return false;
}

export function detectRetryableError(
  error: unknown,
  context?: WorkflowContext
): RetryableError | null {
  // First check if it's explicitly non-retryable
  if (isNonRetryableError(error)) {
    return null;
  }

  // Handle NoSuchToolError
  if (NoSuchToolError.isInstance(error)) {
    const toolName = 'toolName' in error ? String(error.toolName) : 'unknown';
    const availableTools =
      'availableTools' in error && Array.isArray(error.availableTools)
        ? (error.availableTools as string[])
        : [];

    // Create a more specific error message based on context
    let errorMessage = createWorkflowAwareHealingMessage(toolName, context);

    // If we have available tools, make the message even more specific
    if (availableTools.length > 0) {
      errorMessage = `Tool "${toolName}" is not available. You must use one of these tools: ${availableTools.join(', ')}. ${context ? `You are currently in ${context.currentStep} mode.` : ''}`;
    }

    return {
      type: 'no-such-tool',
      originalError: error,
      healingMessage: {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'toolCallId' in error ? String(error.toolCallId) : 'unknown',
            toolName: toolName,
            result: {
              error: errorMessage,
            },
          },
        ],
      },
    };
  }

  // Handle InvalidToolArgumentsError - AI SDK throws this for bad arguments
  if (InvalidToolArgumentsError.isInstance(error)) {
    // Extract detailed error information
    let errorDetails = 'Invalid arguments provided';

    // Extract Zod validation errors if available
    if (
      'cause' in error &&
      error.cause &&
      typeof error.cause === 'object' &&
      'errors' in error.cause
    ) {
      const zodError = error.cause as {
        errors: Array<{ path: Array<string | number>; message: string }>;
      };
      errorDetails = zodError.errors
        .map((e) => `${e.path.length > 0 ? `${e.path.join('.')}: ` : ''}${e.message}`)
        .join('; ');
    }

    // Add tool name if available
    const toolName = 'toolName' in error ? String(error.toolName) : 'unknown tool';

    // Add the actual arguments that were provided if available
    let providedArgs = '';
    if ('args' in error && error.args) {
      try {
        providedArgs = ` You provided: ${JSON.stringify(error.args, null, 2)}`;
      } catch {
        // If args can't be stringified, skip
      }
    }

    return {
      type: 'invalid-tool-arguments',
      originalError: error,
      healingMessage: {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'toolCallId' in error ? String(error.toolCallId) : 'unknown',
            toolName: toolName,
            result: {
              error: `Invalid arguments for ${toolName}. ${errorDetails}.${providedArgs} Please check the required parameters and try again.`,
            },
          },
        ],
      },
    };
  }

  // Handle API call errors (network, rate limits, server errors)
  if (APICallError.isInstance(error)) {
    // Extract response details if available
    let responseDetails = '';
    if ('responseBody' in error && error.responseBody) {
      const body =
        typeof error.responseBody === 'string'
          ? error.responseBody
          : JSON.stringify(error.responseBody);
      responseDetails = ` Details: ${body.substring(0, 200)}`;
    }

    // Rate limit errors
    if (error.statusCode === 429) {
      // Check for retry-after header
      let retryAfter = '';
      if (
        'responseHeaders' in error &&
        error.responseHeaders &&
        typeof error.responseHeaders === 'object'
      ) {
        const headers = error.responseHeaders as Record<string, string | string[]>;
        const retryAfterHeader = headers['retry-after'] || headers['Retry-After'];
        if (retryAfterHeader) {
          retryAfter = ` Please wait ${retryAfterHeader} seconds before retrying.`;
        }
      }

      return {
        type: 'rate-limit',
        originalError: error,
        healingMessage: {
          role: 'user',
          content: `Rate limit reached.${retryAfter}${responseDetails} I'll retry automatically after a delay.`,
        },
      };
    }

    // Server errors (5xx)
    if (error.statusCode && error.statusCode >= 500 && error.statusCode < 600) {
      return {
        type: 'server-error',
        originalError: error,
        healingMessage: {
          role: 'user',
          content: `Server error (${error.statusCode}): The service is temporarily unavailable.${responseDetails} Retrying...`,
        },
      };
    }

    // Network timeout (often no status code)
    if (!error.statusCode || error.cause) {
      const timeoutInfo = error.cause instanceof Error ? ` (${error.cause.message})` : '';
      return {
        type: 'network-timeout',
        originalError: error,
        healingMessage: {
          role: 'user',
          content: `Network connection error${timeoutInfo}. Please retry. If this persists, check your internet connection.`,
        },
      };
    }
  }

  // Also check for errors with APICallError name pattern but not instance
  if (error instanceof Error && error.name === 'APICallError') {
    const statusCode = 'statusCode' in error ? (error as APICallError).statusCode : undefined;
    if (statusCode === 503) {
      return {
        type: 'server-error',
        originalError: error,
        healingMessage: {
          role: 'user',
          content: 'Server temporarily unavailable, retrying...',
        },
      };
    }
  }

  // Handle empty response body errors
  if (EmptyResponseBodyError.isInstance(error)) {
    return {
      type: 'empty-response',
      originalError: error,
      healingMessage: {
        role: 'user',
        content: 'Please continue.',
      },
    };
  }

  // Handle JSON parsing errors in responses
  if (JSONParseError.isInstance(error)) {
    return {
      type: 'json-parse-error',
      originalError: error,
      healingMessage: {
        role: 'user',
        content:
          'There was an issue with the response format. Please try again with proper formatting.',
      },
    };
  }

  // Handle no content generated errors
  if (NoContentGeneratedError.isInstance(error)) {
    return {
      type: 'empty-response',
      originalError: error,
      healingMessage: {
        role: 'user',
        content: 'Please continue.',
      },
    };
  }

  // Handle retry errors (already wrapped by AI SDK)
  if (RetryError.isInstance(error)) {
    // Extract the last error from retry attempts
    const lastError = error.lastError || error.cause;
    if (lastError) {
      // Try to detect the underlying error type
      return detectRetryableError(lastError);
    }
  }

  // Handle tool execution errors
  if (ToolExecutionError.isInstance(error)) {
    return {
      type: 'invalid-tool-arguments',
      originalError: error,
      healingMessage: {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: 'toolCallId' in error ? String(error.toolCallId) : 'unknown',
            toolName: 'toolName' in error ? String(error.toolName) : 'unknown',
            result: {
              error: 'Tool execution failed. Please check your parameters and try again.',
            },
          },
        ],
      },
    };
  }

  // Handle generic "No tool calls generated" error
  if (error instanceof Error && error.message === 'No tool calls generated') {
    return {
      type: 'empty-response',
      originalError: error,
      healingMessage: {
        role: 'user',
        content: 'Please continue.',
      },
    };
  }

  // Catch-all: Any error not explicitly handled above is retryable
  // (unless it was already filtered out as non-retryable)
  let detailedMessage = 'An error occurred';

  if (error instanceof Error) {
    detailedMessage = error.message;

    // Add error name if different from message
    if (error.name && error.name !== 'Error' && !error.message.includes(error.name)) {
      detailedMessage = `${error.name}: ${detailedMessage}`;
    }

    // Add stack trace first line for debugging (if available)
    if (error.stack && context) {
      const firstStackLine = error.stack.split('\n')[1]?.trim();
      if (firstStackLine) {
        detailedMessage = `${detailedMessage} (at ${firstStackLine.substring(0, 100)})`;
      }
    }
  } else {
    detailedMessage = String(error);
  }

  return {
    type: 'unknown-error',
    originalError: error,
    healingMessage: {
      role: 'user',
      content: `${detailedMessage}. Please try again, working around this issue if possible.`,
    },
  };
}
