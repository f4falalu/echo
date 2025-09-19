import { fetchMessageEntries } from '@buster/database/queries';
import type { ModelMessage } from 'ai';
import { z } from 'zod';

// ===== Core Types =====

const OverloadedErrorSchema = z.object({
  type: z.literal('overloaded_error'),
  message: z.string(),
});

type OverloadedError = z.infer<typeof OverloadedErrorSchema>;

/**
 * Agent stream options
 */
interface StreamOptions {
  messages: ModelMessage[];
}

/**
 * Agent interface - flexible to work with AI SDK types
 * The stream method returns the result from AI SDK's streamText
 *
 * @template TStreamResult - The return type from the agent's stream method
 */
interface Agent<TStreamResult = unknown> {
  stream: (options: StreamOptions) => Promise<TStreamResult>;
}

/**
 * Options for retry behavior
 */
interface RetryOptions {
  messageId: string;
  maxAttempts?: number;
  baseDelayMs?: number;
  onRetry?: (attempt: number, recoveredMessageCount: number) => void;
}

/**
 * Result of checking if an error is retryable
 */
interface RetryableCheck {
  isRetryable: boolean;
  error: unknown;
}

// ===== Pure Functions =====

/**
 * Check if an error matches the overloaded error pattern
 * Pure function - no side effects
 */
export const isOverloadedError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  // Direct schema check
  if (OverloadedErrorSchema.safeParse(error).success) {
    return true;
  }

  // Check if wrapped in data property
  if ('data' in error && OverloadedErrorSchema.safeParse(error.data).success) {
    return true;
  }

  // Check error message
  if ('message' in error && typeof error.message === 'string') {
    const lowerMessage = error.message.toLowerCase();
    return (
      lowerMessage.includes('overloaded') || 
      lowerMessage.includes('overloaded_error') ||
      lowerMessage.includes('terminated')
    );
  }

  return false;
};

/**
 * Calculate exponential backoff delay
 * Pure function - deterministic output for given inputs
 */
export const calculateBackoffDelay = (attempt: number, baseDelayMs: number): number => {
  return baseDelayMs * 2 ** (attempt - 1);
};

/**
 * Sleep for a specified duration
 * Returns a promise for composability
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Check if an error is retryable and return structured result
 * Pure function for error analysis
 */
export const analyzeError = (error: unknown): RetryableCheck => ({
  isRetryable: isOverloadedError(error),
  error,
});

/**
 * Recover messages from database
 * Returns either recovered messages or original messages
 */
export const recoverMessages = async (
  messageId: string,
  currentMessages: ModelMessage[]
): Promise<ModelMessage[]> => {
  try {
    const messageEntries = await fetchMessageEntries(messageId);

    if (!messageEntries) {
      console.error('[Agent Retry] Failed to fetch message entries from database', { messageId });
      throw new Error(`Cannot retry: message entries not found for ${messageId}`);
    }

    const recoveredMessages = messageEntries.rawLlmMessages || [];

    if (recoveredMessages.length > 0) {
      console.info('[Agent Retry] Recovered messages from database', {
        messageId,
        recoveredCount: recoveredMessages.length,
      });
      return recoveredMessages;
    }

    return currentMessages;
  } catch (error) {
    console.error('[Agent Retry] Failed to recover from database', {
      messageId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Execute a single stream attempt
 * Composable function that can be used independently
 */
export const executeStreamAttempt = async <TStreamResult>(
  agent: Agent<TStreamResult>,
  messages: ModelMessage[],
  attempt: number,
  maxAttempts: number,
  messageId: string
): Promise<TStreamResult> => {
  console.info(`[Agent Retry] Attempt ${attempt}/${maxAttempts}`, {
    messageId,
    messageCount: messages.length,
  });

  return agent.stream({ messages });
};

/**
 * Handle a failed attempt - analyze error and prepare for retry
 */
export const handleFailedAttempt = async (
  error: unknown,
  attempt: number,
  maxAttempts: number,
  messageId: string,
  currentMessages: ModelMessage[],
  baseDelayMs: number,
  onRetry?: (attempt: number, recoveredMessageCount: number) => void
): Promise<{ shouldRetry: boolean; nextMessages: ModelMessage[]; delayMs: number }> => {
  console.error(`[Agent Retry] Error on attempt ${attempt}`, {
    messageId,
    error: error instanceof Error ? error.message : 'Unknown error',
    isOverloaded: isOverloadedError(error),
  });

  const { isRetryable } = analyzeError(error);

  if (!isRetryable || attempt === maxAttempts) {
    console.error('[Agent Retry] Non-retryable error or max attempts reached', {
      messageId,
      attempt,
      maxAttempts,
    });
    return { shouldRetry: false, nextMessages: currentMessages, delayMs: 0 };
  }

  console.warn('[Agent Retry] Overloaded error detected, preparing retry', {
    messageId,
    attempt,
    remainingAttempts: maxAttempts - attempt,
  });

  try {
    const recoveredMessages = await recoverMessages(messageId, currentMessages);

    if (onRetry) {
      onRetry(attempt, recoveredMessages.length);
    }

    const delayMs = calculateBackoffDelay(attempt, baseDelayMs);

    console.info(`[Agent Retry] Waiting ${delayMs}ms before retry`, {
      messageId,
      attempt,
    });

    return {
      shouldRetry: true,
      nextMessages: recoveredMessages,
      delayMs,
    };
  } catch (_recoveryError) {
    // If recovery fails, don't retry
    return { shouldRetry: false, nextMessages: currentMessages, delayMs: 0 };
  }
};

/**
 * Main retry logic - functional composition of smaller pieces
 */
export const retryStream = async <TStreamResult>(
  agent: Agent<TStreamResult>,
  initialMessages: ModelMessage[],
  options: RetryOptions
): Promise<TStreamResult> => {
  const { messageId, maxAttempts = 3, baseDelayMs = 2000, onRetry } = options;

  let currentMessages = initialMessages;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await executeStreamAttempt(agent, currentMessages, attempt, maxAttempts, messageId);
    } catch (error) {
      lastError = error;

      const { shouldRetry, nextMessages, delayMs } = await handleFailedAttempt(
        error,
        attempt,
        maxAttempts,
        messageId,
        currentMessages,
        baseDelayMs,
        onRetry
      );

      if (!shouldRetry) {
        throw error;
      }

      currentMessages = nextMessages;
      await sleep(delayMs);
    }
  }

  // Should not reach here, but for completeness
  throw lastError;
};

/**
 * Higher-order function to wrap an agent with retry logic
 * Fully type-safe with generics preserved
 */
export function withAgentRetry<
  TStreamResult = unknown,
  TAgent extends Agent<TStreamResult> = Agent<TStreamResult>,
>(agent: TAgent, options: RetryOptions): TAgent {
  // Create a new object with the same prototype
  const wrappedAgent = Object.create(Object.getPrototypeOf(agent)) as TAgent;

  // Copy all properties except stream
  for (const key in agent) {
    if (key !== 'stream' && Object.prototype.hasOwnProperty.call(agent, key)) {
      wrappedAgent[key] = agent[key];
    }
  }

  // Wrap the stream method with retry logic
  wrappedAgent.stream = (streamOptions: StreamOptions) =>
    retryStream(agent, streamOptions.messages, options);

  return wrappedAgent;
}

// ===== Alternative Functional Composition Pattern =====

/**
 * Pipe-style composition for building retry logic
 * More functional programming style
 */
export type StreamExecutor<TStreamResult> = (messages: ModelMessage[]) => Promise<TStreamResult>;

/**
 * Create a retry-wrapped executor using function composition
 */
export const createRetryExecutor = <TStreamResult>(
  executor: StreamExecutor<TStreamResult>,
  options: RetryOptions
): StreamExecutor<TStreamResult> => {
  return async (messages: ModelMessage[]) => {
    const agent: Agent<TStreamResult> = {
      stream: async ({ messages }) => executor(messages),
    };
    return retryStream(agent, messages, options);
  };
};

/**
 * Compose multiple middleware functions
 * Allows for extensible retry + other behaviors
 */
export type StreamMiddleware<TStreamResult> = (
  next: StreamExecutor<TStreamResult>
) => StreamExecutor<TStreamResult>;

export const composeMiddleware = <TStreamResult>(
  ...middlewares: StreamMiddleware<TStreamResult>[]
): StreamMiddleware<TStreamResult> => {
  return (next: StreamExecutor<TStreamResult>) =>
    middlewares.reduceRight((acc, middleware) => middleware(acc), next);
};

/**
 * Retry middleware for composition pattern
 */
export const retryMiddleware = <TStreamResult>(
  options: RetryOptions
): StreamMiddleware<TStreamResult> => {
  return (next: StreamExecutor<TStreamResult>) => createRetryExecutor(next, options);
};

// ===== Utility Functions for Testing =====

/**
 * Create a mock agent for testing
 */
export const createMockAgent = <TStreamResult = unknown>(
  streamFn: () => Promise<TStreamResult>
): Agent<TStreamResult> => ({
  stream: streamFn,
});

/**
 * Create an overloaded error for testing
 */
export const createOverloadedError = (message = 'Overloaded'): OverloadedError => ({
  type: 'overloaded_error',
  message,
});
