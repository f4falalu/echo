import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import type { GrepSearchToolContext, GrepSearchToolState } from './grep-search-tool';
import {
  createGrepSearchToolRawLlmMessageEntry,
  createGrepSearchToolResponseMessage,
} from './helpers/grep-search-tool-transform-helper';

// Factory function that creates a type-safe callback for the specific agent context
export function createGrepSearchToolStart(
  grepSearchToolState: GrepSearchToolState,
  context: GrepSearchToolContext
) {
  return async function grepSearchToolStart(options: ToolCallOptions): Promise<void> {
    grepSearchToolState.entry_id = options.toolCallId;

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
          mode: 'append',
        });
      }
    } catch (error) {
      console.error('[grep-search-tool] Failed to update grep search tool raw LLM message:', error);
    }
  };
}
