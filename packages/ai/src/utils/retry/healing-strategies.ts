import type { CoreMessage } from 'ai';
import type { RetryableError, WorkflowContext } from './types';

export interface HealingStrategy {
  shouldRemoveLastAssistantMessage: boolean;
  healingMessage: CoreMessage | null;
  backoffMultiplier?: number; // Optional multiplier for backoff delay
}

/**
 * Determines the healing strategy based on error type
 * Some errors require removing the problematic message, others just need a healing response
 */
export function determineHealingStrategy(
  retryableError: RetryableError,
  context?: WorkflowContext
): HealingStrategy {
  switch (retryableError.type) {
    // Tool errors - provide healing message but keep the attempt for context
    case 'no-such-tool':
    case 'invalid-tool-arguments':
      return {
        shouldRemoveLastAssistantMessage: false,
        healingMessage: retryableError.healingMessage,
      };

    // Empty/malformed responses - remove the bad message and continue
    case 'empty-response':
    case 'json-parse-error':
      return {
        shouldRemoveLastAssistantMessage: true,
        healingMessage: {
          role: 'user',
          content: 'Please continue with your analysis.',
        },
      };

    // Network/server errors - just retry with backoff
    case 'network-timeout':
    case 'server-error':
      return {
        shouldRemoveLastAssistantMessage: false,
        healingMessage: null, // No healing message needed, just retry
        backoffMultiplier: 2, // Longer backoff for network issues
      };

    // Rate limiting - wait longer before retry
    case 'rate-limit':
      return {
        shouldRemoveLastAssistantMessage: false,
        healingMessage: null, // No healing message needed
        backoffMultiplier: 3, // Even longer backoff for rate limits
      };

    // Unknown errors - generic healing
    default:
      return {
        shouldRemoveLastAssistantMessage: false,
        healingMessage: retryableError.healingMessage,
      };
  }
}

/**
 * Removes the last assistant message from the conversation if it was malformed
 * This is useful for errors like EmptyResponseBodyError where the assistant's response was incomplete
 */
export function removeLastAssistantMessage(messages: CoreMessage[]): CoreMessage[] {
  // Find the last assistant message index
  let lastAssistantIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === 'assistant') {
      lastAssistantIndex = i;
      break;
    }
  }

  if (lastAssistantIndex === -1) {
    // No assistant message found, return as-is
    return messages;
  }

  // Check if there's a tool result after the assistant message
  let hasToolResult = false;
  for (let i = lastAssistantIndex + 1; i < messages.length; i++) {
    if (messages[i]?.role === 'tool') {
      hasToolResult = true;
      break;
    }
  }

  if (hasToolResult) {
    // If there's a tool result, we need to remove both the assistant message and any subsequent tool results
    return messages.slice(0, lastAssistantIndex);
  } else {
    // Just remove the assistant message
    return [...messages.slice(0, lastAssistantIndex), ...messages.slice(lastAssistantIndex + 1)];
  }
}

/**
 * Applies the healing strategy to the conversation
 * Returns the updated messages array
 */
export function applyHealingStrategy(
  messages: CoreMessage[],
  strategy: HealingStrategy
): CoreMessage[] {
  let updatedMessages = [...messages];

  // Remove last assistant message if needed
  if (strategy.shouldRemoveLastAssistantMessage) {
    updatedMessages = removeLastAssistantMessage(updatedMessages);
  }

  // Add healing message if provided
  if (strategy.healingMessage) {
    updatedMessages.push(strategy.healingMessage);
  }

  return updatedMessages;
}

/**
 * Checks if an error type should trigger immediate retry without healing
 * These are typically transient network/server errors
 */
export function shouldRetryWithoutHealing(errorType: string): boolean {
  return ['network-timeout', 'server-error', 'rate-limit'].includes(errorType);
}

/**
 * Gets the appropriate user-facing message for errors that need explanation
 */
export function getErrorExplanationForUser(retryableError: RetryableError): string | null {
  switch (retryableError.type) {
    case 'empty-response':
      return 'The assistant\'s response was incomplete. Retrying...';
    
    case 'json-parse-error':
      return 'There was a formatting issue with the response. Retrying...';
    
    case 'invalid-tool-arguments':
      return 'The tool call had invalid parameters. The assistant will try again with correct parameters.';
    
    case 'no-such-tool':
      return 'The assistant tried to use a tool that\'s not available in the current mode.';
    
    default:
      return null;
  }
}