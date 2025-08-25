import type { ModelMessage } from 'ai';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { messages } from '../../schema';

/**
 * Convert messages from old CoreMessage format (v4) to ModelMessage format (v5)
 * Key changes:
 * - Tool calls: 'args' → 'input'
 * - Tool results: 'result' → structured 'output' object
 * - Image/File parts: 'mimeType' → 'mediaType'
 * - User/Assistant string content remains as string (v5 supports both)
 */
export function convertCoreToModel(messages: unknown): ModelMessage[] {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages.map((message: unknown) => {
    // Basic validation
    if (!message || typeof message !== 'object' || !('role' in message)) {
      return message as ModelMessage;
    }

    const msg = message as Record<string, unknown>;
    const { role, content } = msg;

    switch (role) {
      case 'system':
        // System messages remain string-based in both v4 and v5
        return {
          ...msg,
          content: typeof content === 'string' ? content : '',
        } as ModelMessage;

      case 'user':
        // User messages: handle both string and array content
        if (typeof content === 'string') {
          // v5 supports string content directly for user messages
          return msg as ModelMessage;
        }
        if (Array.isArray(content)) {
          // Convert any image/file parts
          return {
            ...msg,
            content: content.map(convertContentPart),
          } as ModelMessage;
        }
        return { ...msg, content: '' } as ModelMessage;

      case 'assistant':
        // Assistant messages: handle both string and array content
        if (typeof content === 'string') {
          // v5 supports string content directly for assistant messages
          return msg as ModelMessage;
        }
        if (Array.isArray(content)) {
          // Convert tool calls and other parts
          return {
            ...msg,
            content: content.map(convertContentPart),
          } as ModelMessage;
        }
        return { ...msg, content: '' } as ModelMessage;

      case 'tool':
        // Tool messages: convert result to structured output
        if (Array.isArray(content)) {
          return {
            ...msg,
            content: content.map(convertToolResultPart),
          } as ModelMessage;
        }
        return { role: 'tool', content: [] } as ModelMessage;

      default:
        return msg as ModelMessage;
    }
  });
}

/**
 * Convert content parts from v4 to v5 format
 */
function convertContentPart(part: unknown): unknown {
  if (!part || typeof part !== 'object') {
    return part;
  }

  const p = part as Record<string, unknown>;

  switch (p.type) {
    case 'text':
      // Text parts remain the same
      return part;

    case 'image':
      // Convert mimeType → mediaType
      if ('mimeType' in p) {
        const { mimeType, ...rest } = p;
        return {
          ...rest,
          mediaType: mimeType,
        };
      }
      return part;

    case 'file':
      // Convert mimeType → mediaType
      if ('mimeType' in p) {
        const { mimeType, ...rest } = p;
        return {
          ...rest,
          mediaType: mimeType,
        };
      }
      return part;

    case 'tool-call':
      // Tool calls: args → input (AI SDK v5 change)
      if ('args' in p) {
        const { args, ...rest } = p;
        return { ...rest, input: args };
      }
      return part;

    default:
      return part;
  }
}

/**
 * Convert tool result parts from v4 to v5 format
 */
function convertToolResultPart(part: unknown): unknown {
  if (!part || typeof part !== 'object') {
    return part;
  }

  const p = part as Record<string, unknown>;

  if (p.type !== 'tool-result') {
    return part;
  }

  // Convert result → structured output
  if ('result' in p && !('output' in p)) {
    const { result, experimental_content, isError, ...rest } = p;

    // Convert to v5's structured output format
    let output: { type: string; value: unknown };
    if (isError) {
      // Error results
      if (typeof result === 'string') {
        output = { type: 'error-text', value: result };
      } else {
        output = { type: 'error-json', value: result };
      }
    } else {
      // Success results
      if (typeof result === 'string') {
        output = { type: 'text', value: result };
      } else {
        output = { type: 'json', value: result };
      }
    }

    return {
      ...rest,
      output,
    };
  }

  return part;
}

// Helper function to get chatId from messageId
async function getChatIdFromMessage(messageId: string): Promise<string> {
  let messageResult: Array<{ chatId: string }>;
  try {
    messageResult = await db
      .select({
        chatId: messages.chatId,
      })
      .from(messages)
      .where(and(eq(messages.id, messageId), isNull(messages.deletedAt)))
      .limit(1);
  } catch (dbError) {
    throw new Error(
      `Database query failed while finding message: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`
    );
  }

  const messageRow = messageResult[0];
  if (!messageRow) {
    throw new Error('Message not found or has been deleted');
  }

  return messageRow.chatId;
}

// Helper function to get all messages for a chat
async function getAllMessagesForChat(chatId: string): Promise<
  Array<{
    id: string;
    rawLlmMessages: unknown;
    createdAt: string;
    isCompleted: boolean;
  }>
> {
  let chatMessages: Array<{
    id: string;
    rawLlmMessages: unknown;
    createdAt: string;
    isCompleted: boolean;
  }>;
  try {
    chatMessages = await db
      .select({
        id: messages.id,
        rawLlmMessages: messages.rawLlmMessages,
        createdAt: messages.createdAt,
        isCompleted: messages.isCompleted,
      })
      .from(messages)
      .where(and(eq(messages.chatId, chatId), isNull(messages.deletedAt)))
      .orderBy(messages.createdAt);
  } catch (dbError) {
    throw new Error(
      `Database query failed while loading chat messages: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`
    );
  }

  return chatMessages;
}

// Zod schemas for validation
export const ChatConversationHistoryInputSchema = z.object({
  messageId: z.string().uuid('Message ID must be a valid UUID'),
});

export const ChatConversationHistoryOutputSchema = z.array(z.custom<ModelMessage>());

export type ChatConversationHistoryInput = z.infer<typeof ChatConversationHistoryInputSchema>;
export type ChatConversationHistoryOutput = z.infer<typeof ChatConversationHistoryOutputSchema>;

/**
 * Get complete conversation history for a chat from any message in that chat
 * Finds the chat from the given messageId, then merges and deduplicates all rawLlmMessages
 * from all messages in the chat to create a complete conversation history
 */
export async function getChatConversationHistory(
  input: ChatConversationHistoryInput
): Promise<ChatConversationHistoryOutput> {
  try {
    // Validate input
    const validatedInput = ChatConversationHistoryInputSchema.parse(input);

    // Get chatId from messageId
    const chatId = await getChatIdFromMessage(validatedInput.messageId);

    // Get all messages for this chat
    const chatMessages = await getAllMessagesForChat(chatId);

    // Collect all rawLlmMessages from all messages
    const allRawMessages: unknown[] = [];

    for (const message of chatMessages) {
      if (message.rawLlmMessages && Array.isArray(message.rawLlmMessages)) {
        allRawMessages.push(...message.rawLlmMessages);
      }
    }

    if (allRawMessages.length === 0) {
      // If no messages with LLM data, return empty array
      return [];
    }

    // Convert from old CoreMessage format to new ModelMessage format if needed
    const convertedMessages = convertCoreToModel(allRawMessages);

    // Deduplicate messages based on content and role
    // We'll use a Map to track unique messages, using a combination of role and stringified content as the key
    const uniqueMessagesMap = new Map<string, ModelMessage>();

    for (const message of convertedMessages) {
      // Create a unique key based on role and content
      // This ensures we don't have duplicate messages with the same role and content
      const messageKey = JSON.stringify({
        role: message.role,
        content: message.content,
        // Include experimental_providerMetadata if it has messageId for better deduplication
        messageId:
          'experimental_providerMetadata' in message &&
          message.experimental_providerMetadata &&
          typeof message.experimental_providerMetadata === 'object' &&
          'messageId' in message.experimental_providerMetadata
            ? message.experimental_providerMetadata.messageId
            : undefined,
      });

      // Only add if we haven't seen this message before
      if (!uniqueMessagesMap.has(messageKey)) {
        uniqueMessagesMap.set(messageKey, message);
      }
    }

    // Convert back to array and maintain chronological order
    // Since we're merging from multiple messages, we should preserve the order they appear
    const deduplicatedMessages = Array.from(uniqueMessagesMap.values());

    // Validate output
    try {
      return ChatConversationHistoryOutputSchema.parse(deduplicatedMessages);
    } catch (validationError) {
      throw new Error(
        `Output validation failed: ${validationError instanceof Error ? validationError.message : 'Invalid output format'}`
      );
    }
  } catch (error) {
    // Handle Zod input validation errors
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${error.errors.map((e) => e.message).join(', ')}`);
    }

    // Re-throw other errors with context
    throw error instanceof Error
      ? error
      : new Error(`Failed to get chat conversation history: ${String(error)}`);
  }
}
