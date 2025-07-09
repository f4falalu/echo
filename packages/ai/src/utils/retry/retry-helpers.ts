import type { CoreMessage } from 'ai';
import {
  applyHealingStrategy,
  determineHealingStrategy,
  shouldRetryWithoutHealing,
} from './healing-strategies';
import { detectRetryableError } from './retry-agent-stream';
import { RetryWithHealingError } from './retry-error';
import type { RetryableError, WorkflowContext } from './types';

/**
 * Creates an onError handler for agent streaming with retry logic
 */
export function createRetryOnErrorHandler({
  retryCount,
  maxRetries,
  workflowContext,
}: {
  retryCount: number;
  maxRetries: number;
  workflowContext: WorkflowContext;
}) {
  return async (event: { error: unknown }) => {
    const error = event.error;
    console.error(`${workflowContext.currentStep} stream error caught in onError:`, error);

    // Check if max retries reached
    if (retryCount + 1 > maxRetries) {
      console.error(`${workflowContext.currentStep} onError: Max retries reached`, {
        retryCount,
        maxRetries,
      });
      return; // Let the error propagate normally
    }

    // Check if this error has a specific healing strategy
    const retryableError = detectRetryableError(error, workflowContext);

    if (retryableError?.healingMessage) {
      console.info(
        `${workflowContext.currentStep} onError: Setting up retry with specific healing`,
        {
          retryCount: retryCount + 1,
          maxRetries,
          errorType: retryableError.type,
          healingMessage: retryableError.healingMessage,
        }
      );

      // Throw a special error with the healing info
      throw new RetryWithHealingError(retryableError);
    }

    // For all other errors, create a generic healing message
    console.info(
      `${workflowContext.currentStep} onError: Setting up retry with generic healing message`,
      {
        retryCount: retryCount + 1,
        maxRetries,
        errorMessage: error instanceof Error ? error.message : String(error),
      }
    );

    const detailedErrorMessage = extractDetailedErrorMessage(error);

    // Create a generic user message with the detailed error information
    const genericHealingMessage: CoreMessage = {
      role: 'user',
      content: `I encountered an error while processing your request: "${detailedErrorMessage}". Please continue with the analysis, working around this issue if possible. If this is a tool-related error, please use only the available tools for the current step.`,
    };

    // Create a generic retryable error with the healing message
    const genericRetryableError: RetryableError = {
      type: 'unknown-error',
      healingMessage: genericHealingMessage,
      originalError: error,
    };

    // Throw with healing info
    throw new RetryWithHealingError(genericRetryableError);
  };
}

/**
 * Extracts detailed error message from various error types
 */
export function extractDetailedErrorMessage(error: unknown): string {
  let detailedErrorMessage = '';

  if (error instanceof Error) {
    detailedErrorMessage = error.message;

    // Check for Zod validation errors in the cause
    if (
      'cause' in error &&
      error.cause &&
      typeof error.cause === 'object' &&
      'errors' in error.cause
    ) {
      const zodError = error.cause as {
        errors: Array<{ path: Array<string | number>; message: string }>;
      };
      const validationDetails = zodError.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      detailedErrorMessage = `${error.message} - Validation errors: ${validationDetails}`;
    }

    // Check for status code (API errors)
    if ('statusCode' in error && error.statusCode) {
      detailedErrorMessage = `${detailedErrorMessage} (Status: ${error.statusCode})`;
    }

    // Check for response body (API errors)
    if ('responseBody' in error && error.responseBody) {
      const body =
        typeof error.responseBody === 'string'
          ? error.responseBody
          : JSON.stringify(error.responseBody);
      detailedErrorMessage = `${detailedErrorMessage} - Response: ${body.substring(0, 200)}`;
    }

    // Check for tool-specific information
    if ('toolName' in error && error.toolName) {
      detailedErrorMessage = `${detailedErrorMessage} (Tool: ${error.toolName})`;
    }

    // Check for available tools (NoSuchToolError that wasn't caught)
    if ('availableTools' in error && Array.isArray(error.availableTools)) {
      detailedErrorMessage = `${detailedErrorMessage} - Available tools: ${error.availableTools.join(', ')}`;
    }
  } else {
    detailedErrorMessage = String(error);
  }

  return detailedErrorMessage;
}

/**
 * Finds the correct insertion index for healing messages, especially for NoSuchToolError
 */
export function findHealingMessageInsertionIndex(
  retryableError: RetryableError,
  currentMessages: CoreMessage[]
): { insertionIndex: number; updatedHealingMessage: CoreMessage } {
  const healingMessage = retryableError.healingMessage;
  let insertionIndex = currentMessages.length; // Default to end

  // If this is a NoSuchToolError, find the correct position to insert the healing message
  if (retryableError.type === 'no-such-tool' && Array.isArray(healingMessage.content)) {
    const firstContent = healingMessage.content[0];
    if (
      firstContent &&
      typeof firstContent === 'object' &&
      'type' in firstContent &&
      firstContent.type === 'tool-result' &&
      'toolCallId' in firstContent &&
      'toolName' in firstContent
    ) {
      // Find the assistant message with the failed tool call
      for (let i = currentMessages.length - 1; i >= 0; i--) {
        const msg = currentMessages[i];
        if (msg && msg.role === 'assistant' && Array.isArray(msg.content)) {
          // Find tool calls in this message
          const toolCalls = msg.content.filter(
            (
              c
            ): c is {
              type: 'tool-call';
              toolCallId: string;
              toolName: string;
              args: unknown;
            } =>
              typeof c === 'object' &&
              c !== null &&
              'type' in c &&
              c.type === 'tool-call' &&
              'toolCallId' in c &&
              'toolName' in c &&
              'args' in c
          );

          // Check each tool call to see if it matches and has no result
          for (const toolCall of toolCalls) {
            // Check if this tool call matches the failed tool name
            if (toolCall.toolName === firstContent.toolName) {
              // Look ahead for tool results
              let hasResult = false;
              for (let j = i + 1; j < currentMessages.length; j++) {
                const nextMsg = currentMessages[j];
                if (nextMsg && nextMsg.role === 'tool' && Array.isArray(nextMsg.content)) {
                  const hasMatchingResult = nextMsg.content.some(
                    (c) =>
                      typeof c === 'object' &&
                      c !== null &&
                      'type' in c &&
                      c.type === 'tool-result' &&
                      'toolCallId' in c &&
                      c.toolCallId === toolCall.toolCallId
                  );
                  if (hasMatchingResult) {
                    hasResult = true;
                    break;
                  }
                }
              }

              // If this tool call has no result, this is our failed call
              if (!hasResult) {
                console.info('Found orphaned tool call, using its ID for healing', {
                  toolCallId: toolCall.toolCallId,
                  toolName: toolCall.toolName,
                  atIndex: i,
                });

                // Update the healing message with the correct toolCallId (immutable)
                const updatedFirstContent = { ...firstContent, toolCallId: toolCall.toolCallId };
                healingMessage.content[0] = updatedFirstContent;

                // Insert position is right after this assistant message
                insertionIndex = i + 1;
                break;
              }
            }
          }

          // If we found the position, stop searching
          if (insertionIndex !== currentMessages.length) break;
        }
      }
    }
  }

  return { insertionIndex, updatedHealingMessage: healingMessage };
}

/**
 * Calculates exponential backoff delay with a maximum cap
 */
export function calculateBackoffDelay(retryCount: number, maxDelay = 10000): number {
  return Math.min(1000 * 2 ** retryCount, maxDelay);
}

/**
 * Creates user-friendly error messages based on error type
 */
export function createUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Check if it's a database connection error
    if (error.message.includes('DATABASE_URL')) {
      return 'Unable to connect to the analysis service. Please try again later.';
    }

    // Check if it's an API/model error
    if (error.message.includes('API') || error.message.includes('model')) {
      return 'The analysis service is temporarily unavailable. Please try again in a few moments.';
    }
  }

  // For unexpected errors, provide a generic friendly message
  return 'Something went wrong during the analysis. Please try again or contact support if the issue persists.';
}

/**
 * Logs retry information for debugging
 */
export function logRetryInfo(
  stepName: string,
  retryableError: RetryableError,
  retryCount: number,
  insertionIndex: number,
  totalMessages: number,
  backoffDelay: number,
  healingMessage: CoreMessage
): void {
  console.info(`${stepName}: Retrying with healing message after backoff`, {
    retryCount,
    errorType: retryableError.type,
    insertionIndex,
    totalMessages,
    backoffDelay,
    healingMessageRole: healingMessage.role,
    healingMessageContent: healingMessage.content,
  });
}

/**
 * Logs message state after healing insertion for debugging
 */
export function logMessagesAfterHealing(
  stepName: string,
  originalCount: number,
  updatedMessages: CoreMessage[],
  insertionIndex: number,
  healingMessage: CoreMessage
): void {
  console.info(`${stepName}: Messages after healing insertion`, {
    originalCount,
    updatedCount: updatedMessages.length,
    insertionIndex,
    healingMessageIndex: updatedMessages.findIndex((m) => m === healingMessage),
    lastThreeMessages: updatedMessages.slice(-3).map((m) => ({
      role: m.role,
      content:
        typeof m.content === 'string'
          ? m.content.substring(0, 100)
          : Array.isArray(m.content)
            ? m.content[0]
            : m.content,
    })),
  });
}

/**
 * Handles retry logic after a RetryWithHealingError is caught
 * Returns the healed messages and whether to continue without healing
 */
export async function handleRetryWithHealing(
  retryableError: RetryableError,
  currentMessages: CoreMessage[],
  retryCount: number,
  context: WorkflowContext
): Promise<{
  healedMessages: CoreMessage[];
  shouldContinueWithoutHealing: boolean;
  backoffDelay: number;
}> {
  // Determine the healing strategy
  const healingStrategy = determineHealingStrategy(retryableError, context);

  // For network/server errors, just retry without healing
  if (shouldRetryWithoutHealing(retryableError.type)) {
    const backoffDelay =
      calculateBackoffDelay(retryCount, 10000) * (healingStrategy.backoffMultiplier || 1);
    console.info(`${context.currentStep}: Retrying after network/server error`, {
      retryCount,
      errorType: retryableError.type,
      backoffDelay,
    });

    return {
      healedMessages: currentMessages,
      shouldContinueWithoutHealing: true,
      backoffDelay,
    };
  }

  // Apply healing strategy to get updated messages
  let healedMessages = applyHealingStrategy(currentMessages, healingStrategy);

  // For tool errors, we still need to find the correct insertion point
  if (retryableError.type === 'no-such-tool' && healingStrategy.healingMessage) {
    const { insertionIndex, updatedHealingMessage } = findHealingMessageInsertionIndex(
      retryableError,
      currentMessages
    );

    // Remove the healing message that was added by applyHealingStrategy
    const messagesWithoutHealing = healedMessages.slice(0, -1);

    // Insert at the correct position
    healedMessages = [
      ...messagesWithoutHealing.slice(0, insertionIndex),
      updatedHealingMessage,
      ...messagesWithoutHealing.slice(insertionIndex),
    ];
  }

  // Calculate backoff delay
  const backoffDelay = calculateBackoffDelay(retryCount) * (healingStrategy.backoffMultiplier || 1);

  console.info(`${context.currentStep}: Applying healing strategy`, {
    retryCount,
    errorType: retryableError.type,
    shouldRemoveLastMessage: healingStrategy.shouldRemoveLastAssistantMessage,
    hasHealingMessage: !!healingStrategy.healingMessage,
    backoffDelay,
  });

  return {
    healedMessages,
    shouldContinueWithoutHealing: false,
    backoffDelay,
  };
}
