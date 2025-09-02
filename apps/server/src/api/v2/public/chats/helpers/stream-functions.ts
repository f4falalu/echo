import type {
  PublicChatErrorEvent,
  PublicChatEvent,
  PublicChatResponseEvent,
  PublicChatStatusEvent,
} from '@buster/server-shared';
import { PublicChatError, PublicChatErrorCode } from '@buster/server-shared';
import { SSEStreamController } from '../../../../../utils/sse';
import { buildChatLink } from './chat-functions';
import { type MessageCompletionResult, createPollingGenerator } from './polling-functions';

/**
 * Creates an initial status event
 * @param chatId The chat ID
 * @returns The status event
 */
export function createInitialStatusEvent(chatId: string): PublicChatStatusEvent {
  return {
    type: 'status',
    message: "I've started working on your request. I'll notify you when it's finished.",
    link: buildChatLink(chatId),
  };
}

/**
 * Creates a response event
 * @param message The response message
 * @param chatId The chat ID
 * @param fileInfo Optional file information
 * @returns The response event
 */
export function createResponseEvent(
  message: string,
  chatId: string,
  fileInfo?: {
    fileId: string | null;
    fileType: string | null;
    versionNumber: number | null;
  }
): PublicChatResponseEvent {
  return {
    type: 'response',
    message,
    link: buildChatLink(chatId, fileInfo?.fileId, fileInfo?.fileType, fileInfo?.versionNumber),
    is_finished: true,
  };
}

/**
 * Creates an error event
 * @param error The error message
 * @returns The error event
 */
export function createErrorEvent(error: string): PublicChatErrorEvent {
  return {
    type: 'error',
    error,
  };
}

/**
 * Creates an SSE response stream for a chat
 * @param chatId The chat ID
 * @param messageId The message ID to poll
 * @returns A ReadableStream for SSE
 */
export function createSSEResponseStream(
  chatId: string,
  messageId: string
): ReadableStream<Uint8Array> {
  const controller = new SSEStreamController();
  const stream = controller.createStream();

  // Start the async processing
  processMessageWithSSE(chatId, messageId, controller).catch((error) => {
    console.error('SSE processing error:', error);
    // Send error event before closing
    controller.sendEvent(createErrorEvent('An error occurred while processing your request'));
    controller.close();
  });

  return stream;
}

/**
 * Processes a message and sends SSE events
 * @param chatId The chat ID
 * @param messageId The message ID
 * @param controller The SSE stream controller
 */
async function processMessageWithSSE(
  chatId: string,
  messageId: string,
  controller: SSEStreamController
): Promise<void> {
  try {
    // Send initial status event
    const statusEvent = createInitialStatusEvent(chatId);
    controller.sendEvent(statusEvent);

    // Start polling for completion
    const pollingGenerator = createPollingGenerator(messageId);

    for await (const pollResult of pollingGenerator) {
      if (pollResult.status === 'completed' && pollResult.result) {
        // Send the final response
        const responseEvent = createResponseEvent(
          pollResult.result.responseMessage || "I've completed your request!",
          chatId,
          pollResult.result.fileInfo
        );
        controller.sendEvent(responseEvent);
        break;
      }
      // For pending status, we don't send additional events
      // The initial status message is sufficient
    }
  } catch (error) {
    // Handle errors
    if (error instanceof PublicChatError) {
      controller.sendEvent(createErrorEvent(error.message));
    } else {
      controller.sendEvent(
        createErrorEvent('An unexpected error occurred while processing your request')
      );
    }
    throw error;
  } finally {
    // Always close the stream
    controller.close();
  }
}

/**
 * Creates an async generator for SSE events
 * Useful for alternative SSE implementations
 * @param chatId The chat ID
 * @param messageId The message ID
 */
export async function* createSSEEventGenerator(
  chatId: string,
  messageId: string
): AsyncGenerator<PublicChatEvent> {
  try {
    // Yield initial status
    yield createInitialStatusEvent(chatId);

    // Poll for completion
    const pollingGenerator = createPollingGenerator(messageId);

    for await (const pollResult of pollingGenerator) {
      if (pollResult.status === 'completed' && pollResult.result) {
        // Yield final response
        yield createResponseEvent(
          pollResult.result.responseMessage || "I've completed your request!",
          chatId,
          pollResult.result.fileInfo
        );
        return;
      }
    }
  } catch (error) {
    // Yield error event
    if (error instanceof PublicChatError) {
      yield createErrorEvent(error.message);
    } else {
      yield createErrorEvent('An unexpected error occurred');
    }
    throw error;
  }
}
