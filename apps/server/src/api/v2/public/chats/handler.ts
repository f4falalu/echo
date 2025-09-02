import type { ApiKeyContext, PublicChatRequest } from '@buster/server-shared';
import { PublicChatError, PublicChatErrorCode } from '@buster/server-shared';
import { extractMessageId, initializeChat } from './helpers/chat-functions';
import { createSSEResponseStream } from './helpers/stream-functions';
import { resolveAndValidateUser } from './helpers/user-functions';

/**
 * Main handler for public chat API requests
 * Composes all the functional components to process a chat request
 * @param request The validated public chat request
 * @param apiKey The validated API key context
 * @returns A ReadableStream for SSE responses
 */
export async function publicChatHandler(
  request: PublicChatRequest,
  apiKey: ApiKeyContext
): Promise<ReadableStream<Uint8Array>> {
  try {
    // Step 1: Resolve and validate the user
    const user = await resolveAndValidateUser(request.email, apiKey.organizationId);

    // Step 2: Initialize the chat with the prompt
    const chat = await initializeChat(request.prompt, user, apiKey.organizationId);

    // Step 3: Extract the message ID from the chat
    const messageId = extractMessageId(chat);

    // Step 4: Create and return the SSE response stream
    // The stream will handle:
    // - Sending initial status message
    // - Polling for completion
    // - Sending final response
    // - Error handling
    return createSSEResponseStream(chat.id, messageId);
  } catch (error) {
    // Handle errors that occur before streaming starts
    if (error instanceof PublicChatError) {
      throw error;
    }

    console.error('Unexpected error in public chat handler:', error);
    throw new PublicChatError(
      PublicChatErrorCode.INTERNAL_ERROR,
      'An unexpected error occurred',
      500
    );
  }
}

/**
 * Functional composition helper for better error handling
 * Can be used to chain operations with proper error boundaries
 */
export function compose<T>(...fns: Array<(arg: unknown) => unknown>) {
  return (initialValue: T) =>
    fns.reduce((acc, fn) => {
      try {
        return fn(acc);
      } catch (error) {
        if (error instanceof PublicChatError) {
          throw error;
        }
        throw new PublicChatError(PublicChatErrorCode.INTERNAL_ERROR, 'Operation failed', 500);
      }
    }, initialValue as unknown) as unknown;
}

/**
 * Async composition helper for chaining async operations
 */
export function composeAsync<T>(...fns: Array<(arg: unknown) => Promise<unknown>>) {
  return async (initialValue: T) => {
    let result: unknown = initialValue;
    for (const fn of fns) {
      try {
        result = await fn(result);
      } catch (error) {
        if (error instanceof PublicChatError) {
          throw error;
        }
        throw new PublicChatError(
          PublicChatErrorCode.INTERNAL_ERROR,
          'Async operation failed',
          500
        );
      }
    }
    return result;
  };
}
