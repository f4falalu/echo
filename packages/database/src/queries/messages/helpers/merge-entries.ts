import type { ModelMessage } from 'ai';
import type {
  ChatMessageReasoningMessage,
  ChatMessageResponseMessage,
} from '../../../schemas/message-schemas';

/**
 * Merges response messages by 'id' field, preserving order
 * New messages with matching IDs replace existing ones at their original position
 * New messages without matching IDs are appended
 */
export function mergeResponseMessages(
  existing: ChatMessageResponseMessage[],
  updates: ChatMessageResponseMessage[]
): ChatMessageResponseMessage[] {
  if (!existing || existing.length === 0) {
    return updates;
  }

  // Create a map of new messages by ID
  const updateMap = new Map<string, ChatMessageResponseMessage>();

  for (const msg of updates) {
    updateMap.set(msg.id, msg);
  }

  // Keep track of which IDs we've already processed
  const processedIds = new Set<string>();

  // First pass: update existing messages in place
  const merged = existing.map((existingMsg) => {
    if (updateMap.has(existingMsg.id)) {
      processedIds.add(existingMsg.id);
      const updated = updateMap.get(existingMsg.id);
      if (!updated) {
        throw new Error(`Expected to find message with id ${existingMsg.id} in updateMap`);
      }
      return updated;
    }
    return existingMsg;
  });

  // Second pass: append new messages that weren't in existing
  for (const updateMsg of updates) {
    if (!processedIds.has(updateMsg.id)) {
      merged.push(updateMsg);
    }
  }

  return merged;
}

/**
 * Merges reasoning messages by 'id' field, preserving order
 * New messages with matching IDs replace existing ones at their original position
 * New messages without matching IDs are appended
 */
export function mergeReasoningMessages(
  existing: ChatMessageReasoningMessage[],
  updates: ChatMessageReasoningMessage[]
): ChatMessageReasoningMessage[] {
  if (!existing || existing.length === 0) {
    return updates;
  }

  // Create a map of new messages by ID
  const updateMap = new Map<string, ChatMessageReasoningMessage>();

  for (const msg of updates) {
    updateMap.set(msg.id, msg);
  }

  // Keep track of which IDs we've already processed
  const processedIds = new Set<string>();

  // First pass: update existing messages in place
  const merged = existing.map((existingMsg) => {
    if (updateMap.has(existingMsg.id)) {
      processedIds.add(existingMsg.id);
      const updated = updateMap.get(existingMsg.id);
      if (!updated) {
        throw new Error(`Expected to find message with id ${existingMsg.id} in updateMap`);
      }
      return updated;
    }
    return existingMsg;
  });

  // Second pass: append new messages that weren't in existing
  for (const updateMsg of updates) {
    if (!processedIds.has(updateMsg.id)) {
      merged.push(updateMsg);
    }
  }

  return merged;
}

/**
 * Helper to extract tool call IDs from content
 */
function getToolCallIds(content: unknown): string {
  if (!content || typeof content !== 'object') {
    return '';
  }

  if (Array.isArray(content)) {
    const toolCallIds: string[] = [];
    for (const item of content) {
      if (typeof item === 'object' && item !== null && 'toolCallId' in item) {
        const toolCallId = (item as { toolCallId?: unknown }).toolCallId;
        if (typeof toolCallId === 'string') {
          toolCallIds.push(toolCallId);
        }
      }
    }
    return toolCallIds.sort().join(',');
  }

  return '';
}

/**
 * Creates a unique key for raw LLM messages based on role and tool call IDs
 */
function getRawLlmMessageKey(message: ModelMessage): string {
  const role = message.role || '';
  const toolCallIds = getToolCallIds(message.content);
  return `${role}:${toolCallIds}`;
}

/**
 * Ensures tool calls always precede their corresponding tool results
 * This fixes any ordering issues that may occur during concurrent updates
 */
function sortToolCallsBeforeResults(messages: ModelMessage[]): ModelMessage[] {
  // Map to store tool call/result pairs
  const toolPairs = new Map<
    string,
    { call?: ModelMessage; result?: ModelMessage; callIndex?: number; resultIndex?: number }
  >();
  const standaloneMessages: { message: ModelMessage; index: number }[] = [];

  // First pass: identify tool calls and results
  messages.forEach((msg, index) => {
    const toolCallIds = getToolCallIds(msg.content);

    if (toolCallIds) {
      // This message has tool call IDs
      const toolCallIdList = toolCallIds.split(',');

      for (const toolCallId of toolCallIdList) {
        if (!toolCallId) continue;

        const pair = toolPairs.get(toolCallId) || {};

        if (msg.role === 'assistant') {
          // This is a tool call
          pair.call = msg;
          pair.callIndex = index;
        } else if (msg.role === 'tool') {
          // This is a tool result
          pair.result = msg;
          pair.resultIndex = index;
        }

        toolPairs.set(toolCallId, pair);
      }
    } else {
      // Standalone message without tool call IDs
      standaloneMessages.push({ message: msg, index });
    }
  });

  // Build the sorted array
  const sorted: ModelMessage[] = [];
  const processedIndices = new Set<number>();

  // Process messages in original order, but ensure tool pairs are correctly ordered
  messages.forEach((msg, index) => {
    if (processedIndices.has(index)) {
      return; // Already processed as part of a tool pair
    }

    const toolCallIds = getToolCallIds(msg.content);

    if (toolCallIds) {
      const toolCallIdList = toolCallIds.split(',');

      for (const toolCallId of toolCallIdList) {
        if (!toolCallId) continue;

        const pair = toolPairs.get(toolCallId);
        if (!pair) continue;

        // If this is a tool result that appears before its call, skip it for now
        if (
          msg.role === 'tool' &&
          pair.call &&
          pair.callIndex !== undefined &&
          pair.callIndex > index &&
          !processedIndices.has(pair.callIndex)
        ) {
          continue; // Will be added when we process the call
        }

        // If this is a tool call, add both call and result in correct order
        if (msg.role === 'assistant' && pair.call && !processedIndices.has(index)) {
          sorted.push(pair.call);
          processedIndices.add(index);

          // Add the corresponding result immediately after
          if (
            pair.result &&
            pair.resultIndex !== undefined &&
            !processedIndices.has(pair.resultIndex)
          ) {
            sorted.push(pair.result);
            processedIndices.add(pair.resultIndex);
          }
        }

        // If this is an orphaned tool result (no corresponding call), add it
        if (msg.role === 'tool' && !pair.call && !processedIndices.has(index)) {
          sorted.push(msg);
          processedIndices.add(index);
        }
      }
    } else {
      // Standalone message
      sorted.push(msg);
      processedIndices.add(index);
    }
  });

  return sorted;
}

/**
 * Merges raw LLM messages by combination of 'role' and 'toolCallId', preserving order
 * Messages with the same role and tool call IDs replace existing ones at their original position
 * New messages are appended
 * Tool calls are guaranteed to precede their corresponding tool results
 */
export function mergeRawLlmMessages(
  existing: ModelMessage[],
  updates: ModelMessage[]
): ModelMessage[] {
  if (!existing || existing.length === 0) {
    return sortToolCallsBeforeResults(updates);
  }

  // Create a map of new messages by their unique key
  const updateMap = new Map<string, ModelMessage>();

  for (const msg of updates) {
    const key = getRawLlmMessageKey(msg);
    updateMap.set(key, msg);
  }

  // Keep track of which keys we've already processed
  const processedKeys = new Set<string>();

  // First pass: update existing messages in place
  const merged = existing.map((existingMsg) => {
    const key = getRawLlmMessageKey(existingMsg);
    if (updateMap.has(key)) {
      processedKeys.add(key);
      const updated = updateMap.get(key);
      if (!updated) {
        throw new Error(`Expected to find message with key ${key} in updateMap`);
      }
      return updated;
    }
    return existingMsg;
  });

  // Second pass: append new messages that weren't in existing
  for (const updateMsg of updates) {
    const key = getRawLlmMessageKey(updateMsg);
    if (!processedKeys.has(key)) {
      merged.push(updateMsg);
    }
  }

  // Ensure tool calls always precede their results
  return sortToolCallsBeforeResults(merged);
}
