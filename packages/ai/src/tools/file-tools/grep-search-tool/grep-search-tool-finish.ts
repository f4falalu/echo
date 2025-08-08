import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import type {
  GrepSearchToolContext,
  GrepSearchToolInput,
  GrepSearchToolState,
} from './grep-search-tool';
import {
  createGrepSearchToolRawLlmMessageEntry,
  createGrepSearchToolResponseMessage,
} from './helpers/grep-search-tool-transform-helper';

export function createGrepSearchToolFinish(
  grepSearchToolState: GrepSearchToolState,
  context: GrepSearchToolContext
) {
  return async function grepSearchToolFinish(
    options: { input: GrepSearchToolInput } & ToolCallOptions
  ): Promise<void> {
    grepSearchToolState.entry_id = options.toolCallId;

    // Update state with final input
    grepSearchToolState.commands = options.input.commands;

    const grepSearchToolResponseEntry = createGrepSearchToolResponseMessage(
      grepSearchToolState,
      options.toolCallId
    );
    const grepSearchToolMessage = createGrepSearchToolRawLlmMessageEntry(
      grepSearchToolState,
      options.toolCallId
    );

    try {
      if (grepSearchToolMessage) {
        await updateMessageEntries({
          messageId: context.messageId,
          responseEntry: grepSearchToolResponseEntry,
          rawLlmMessage: grepSearchToolMessage,
          mode: 'update',
        });
      }
    } catch (error) {
      console.error('[grep-search-tool] Failed to update grep search tool raw LLM message:', error);
    }
  };
}
