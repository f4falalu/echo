import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import {
  OptimisticJsonParser,
  getOptimisticValue,
} from '../../../utils/streaming/optimistic-json-parser';
import {
  type GrepSearchToolContext,
  type GrepSearchToolInput,
  GrepSearchToolInputSchema,
  type GrepSearchToolState,
} from './grep-search-tool';
import {
  createGrepSearchToolRawLlmMessageEntry,
  createGrepSearchToolResponseMessage,
} from './helpers/grep-search-tool-transform-helper';

// Type-safe key extraction from the schema - will cause compile error if field name changes
// Using keyof with the inferred type ensures we're using the actual schema keys
const COMMANDS_KEY = 'commands' as const satisfies keyof GrepSearchToolInput;

export function createGrepSearchToolDelta(
  grepSearchToolState: GrepSearchToolState,
  context: GrepSearchToolContext
) {
  return async function grepSearchToolDelta(
    options: { inputTextDelta: string } & ToolCallOptions
  ): Promise<void> {
    // Accumulate the delta to the args
    grepSearchToolState.args = (grepSearchToolState.args || '') + options.inputTextDelta;

    // Use optimistic parsing to extract values even from incomplete JSON
    const parseResult = OptimisticJsonParser.parse(grepSearchToolState.args);

    // Extract commands from the optimistically parsed values - type-safe key
    const commands = getOptimisticValue<string[]>(parseResult.extractedValues, COMMANDS_KEY);

    if (commands !== undefined && Array.isArray(commands) && commands.length > 0) {
      // Update the state with the extracted commands
      grepSearchToolState.commands = commands;

      // Create the response entries with the current state
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
        console.error(
          '[grep-search-tool] Failed to update grep search tool raw LLM message:',
          error
        );
      }
    }
  };
}
