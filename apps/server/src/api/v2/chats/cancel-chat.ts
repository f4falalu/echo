import { canUserAccessChatCached } from '@buster/access-controls';
import {
  type ToolCallContent,
  type ToolResultContent,
  isToolCallContent,
  isToolResultContent,
} from '@buster/ai/utils/database/types';
import type { User } from '@buster/database';
import { and, eq, isNotNull, updateMessageFields } from '@buster/database';
import { db, messages } from '@buster/database';
import type {
  ChatMessageReasoningMessage,
  ChatMessageResponseMessage,
} from '@buster/server-shared/chats';
import { runs } from '@trigger.dev/sdk';
import type { CoreMessage } from 'ai';
import { errorResponse } from '../../../utils/response';

/**
 * Cancel a chat and clean up any incomplete messages
 *
 * Strategy:
 * 1. Cancel the trigger runs
 * 2. Fetch fresh data and clean up messages
 * 3. Mark messages as completed with proper cleanup
 */
export async function cancelChatHandler(chatId: string, user: User): Promise<void> {
  const userHasAccessToChat = await canUserAccessChatCached({
    userId: user.id,
    chatId,
  });

  if (!userHasAccessToChat) {
    throw errorResponse('You do not have access to this chat', 403);
  }

  // First, query just for IDs and trigger run IDs
  const messagesToCancel = await db
    .select({
      id: messages.id,
      triggerRunId: messages.triggerRunId,
    })
    .from(messages)
    .where(
      and(
        eq(messages.chatId, chatId),
        eq(messages.isCompleted, false),
        isNotNull(messages.triggerRunId)
      )
    );

  // Type narrow to ensure triggerRunId is not null
  const incompleteTriggerMessages = messagesToCancel.filter(
    (result): result is { id: string; triggerRunId: string } => result.triggerRunId !== null
  );

  // Cancel all trigger runs first
  const cancellationPromises = incompleteTriggerMessages.map(async (message) => {
    try {
      await runs.cancel(message.triggerRunId);
      console.info(`Cancelled trigger run ${message.triggerRunId} for message ${message.id}`);
    } catch (error) {
      console.error(`Failed to cancel trigger run ${message.triggerRunId}:`, error);
      // Continue with cleanup even if cancellation fails
    }
  });

  // Wait for all cancellations to complete
  await Promise.allSettled(cancellationPromises);

  await new Promise((resolve) => setTimeout(resolve, 500));

  // Now fetch the latest message data and clean up each message
  const cleanupPromises = incompleteTriggerMessages.map(async (message) => {
    // Fetch the latest message data
    const [latestMessageData] = await db
      .select({
        rawLlmMessages: messages.rawLlmMessages,
        reasoning: messages.reasoning,
        responseMessages: messages.responseMessages,
      })
      .from(messages)
      .where(eq(messages.id, message.id));

    if (latestMessageData) {
      await cleanUpMessage(
        message.id,
        latestMessageData.rawLlmMessages,
        latestMessageData.reasoning,
        latestMessageData.responseMessages
      );
    }
  });

  // Wait for all cleanups to complete
  await Promise.allSettled(cleanupPromises);
}
/**
 * Find tool calls without corresponding tool results
 */
function findIncompleteToolCalls(messages: CoreMessage[]): ToolCallContent[] {
  const toolCalls = new Map<string, ToolCallContent>();
  const toolResults = new Set<string>();

  // First pass: collect all tool calls and tool results
  for (const message of messages) {
    if (message.role === 'assistant' && Array.isArray(message.content)) {
      for (const content of message.content) {
        if (isToolCallContent(content)) {
          toolCalls.set(content.toolCallId, content);
        }
      }
    } else if (message.role === 'tool' && Array.isArray(message.content)) {
      for (const content of message.content) {
        if (isToolResultContent(content)) {
          toolResults.add(content.toolCallId);
        }
      }
    }
  }

  // Second pass: find tool calls without results
  const incompleteToolCalls: ToolCallContent[] = [];
  for (const [toolCallId, toolCall] of toolCalls) {
    if (!toolResults.has(toolCallId)) {
      incompleteToolCalls.push(toolCall);
    }
  }

  return incompleteToolCalls;
}

/**
 * Create tool result messages for incomplete tool calls
 */
function createCancellationToolResults(incompleteToolCalls: ToolCallContent[]): CoreMessage[] {
  if (incompleteToolCalls.length === 0) {
    return [];
  }

  const toolResultMessages: CoreMessage[] = [];

  for (const toolCall of incompleteToolCalls) {
    const toolResult: ToolResultContent = {
      type: 'tool-result',
      toolCallId: toolCall.toolCallId,
      toolName: toolCall.toolName,
      result: {
        error: true,
        message: 'The user ended the chat',
      },
    };

    toolResultMessages.push({
      role: 'tool',
      content: [toolResult],
    });
  }

  return toolResultMessages;
}

/**
 * Clean up messages by adding tool results for incomplete tool calls
 */
function cleanUpRawLlmMessages(messages: CoreMessage[]): CoreMessage[] {
  const incompleteToolCalls = findIncompleteToolCalls(messages);

  if (incompleteToolCalls.length === 0) {
    return messages;
  }

  // Create tool result messages for incomplete tool calls
  const toolResultMessages = createCancellationToolResults(incompleteToolCalls);

  // Append tool results to the messages
  return [...messages, ...toolResultMessages];
}

/**
 * Ensure reasoning messages are marked as completed
 */
function ensureReasoningMessagesCompleted(
  reasoning: ChatMessageReasoningMessage[]
): ChatMessageReasoningMessage[] {
  console.info('Ensuring reasoning messages are completed:', {
    totalMessages: reasoning.length,
    loadingMessages: reasoning.filter(
      (msg) => msg && typeof msg === 'object' && 'status' in msg && msg.status === 'loading'
    ).length,
  });

  return reasoning.map((msg, index) => {
    if (msg && typeof msg === 'object' && 'status' in msg && msg.status === 'loading') {
      console.info(`Marking reasoning message ${index} as completed:`, {
        id: 'id' in msg ? msg.id : 'unknown',
        title: 'title' in msg ? msg.title : 'unknown',
        previousStatus: msg.status,
      });
      return {
        ...msg,
        status: 'completed' as const,
      };
    }
    return msg;
  });
}

/**
 * Clean up and finalize all message fields for a cancelled chat
 */
interface CleanedMessageFields {
  rawLlmMessages: CoreMessage[];
  reasoning: ChatMessageReasoningMessage[];
  responseMessages: ChatMessageResponseMessage[];
}

function cleanUpMessageFields(
  rawLlmMessages: CoreMessage[],
  reasoning: ChatMessageReasoningMessage[],
  responseMessages: ChatMessageResponseMessage[]
): CleanedMessageFields {
  // Clean up raw LLM messages by adding tool results for incomplete tool calls
  const cleanedRawMessages = cleanUpRawLlmMessages(rawLlmMessages);

  // Ensure all reasoning messages are marked as completed
  const completedReasoning = ensureReasoningMessagesCompleted(reasoning);

  return {
    rawLlmMessages: cleanedRawMessages,
    reasoning: completedReasoning,
    responseMessages: responseMessages,
  };
}

async function cleanUpMessage(
  messageId: string,
  rawLlmMessages: unknown,
  reasoning: unknown,
  responseMessages: unknown
): Promise<void> {
  try {
    // Parse and validate the message fields
    const currentRawMessages = Array.isArray(rawLlmMessages)
      ? (rawLlmMessages as CoreMessage[])
      : [];
    const currentReasoning = Array.isArray(reasoning)
      ? (reasoning as ChatMessageReasoningMessage[])
      : [];

    // Handle responseMessages which could be an array or object
    let currentResponseMessages: ChatMessageResponseMessage[] = [];
    if (Array.isArray(responseMessages)) {
      currentResponseMessages = responseMessages as ChatMessageResponseMessage[];
    } else if (responseMessages && typeof responseMessages === 'object') {
      // Convert object to array if it has values
      const values = Object.values(responseMessages);
      if (values.length > 0 && values.every((v) => v && typeof v === 'object')) {
        currentResponseMessages = values as ChatMessageResponseMessage[];
      }
    }

    console.info(`Cleaning up message ${messageId}:`, {
      rawMessagesCount: currentRawMessages.length,
      reasoningCount: currentReasoning.length,
      responseMessagesCount: currentResponseMessages.length,
      responseMessagesType: Array.isArray(responseMessages) ? 'array' : typeof responseMessages,
    });

    // Clean up all message fields
    const cleanedFields = cleanUpMessageFields(
      currentRawMessages,
      currentReasoning,
      currentResponseMessages
    );

    // Determine the final reasoning message based on whether we were in response phase
    const hasResponseMessages = currentResponseMessages.length > 0;
    const finalReasoningMessage = hasResponseMessages
      ? 'Stopped during final response'
      : 'Stopped reasoning';

    // Log the cleaned reasoning to debug
    console.info('Cleaned reasoning before save:', {
      reasoningCount: cleanedFields.reasoning.length,
      loadingCount: cleanedFields.reasoning.filter(
        (r) => r && typeof r === 'object' && 'status' in r && r.status === 'loading'
      ).length,
      lastReasoningMessage: cleanedFields.reasoning[cleanedFields.reasoning.length - 1],
    });

    // Ensure the reasoning array is properly serializable
    const serializableReasoning = JSON.parse(JSON.stringify(cleanedFields.reasoning));

    // Update the message in the database
    await updateMessageFields(messageId, {
      rawLlmMessages: cleanedFields.rawLlmMessages,
      reasoning: serializableReasoning,
      responseMessages: cleanedFields.responseMessages,
      finalReasoningMessage: finalReasoningMessage,
      isCompleted: true,
    });

    console.info(
      `Successfully cleaned up message ${messageId} with finalReasoningMessage: ${finalReasoningMessage}`
    );
  } catch (error) {
    console.error(`Failed to clean up message ${messageId}:`, error);
    // Don't throw - we want to continue processing other messages
  }
}
