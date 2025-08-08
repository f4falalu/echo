import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import {
  OptimisticJsonParser,
  getOptimisticValue,
} from '../../../utils/streaming/optimistic-json-parser';
import type { BashToolContext, BashToolInput, BashToolState } from './bash-tool';
import {
  createBashToolRawLlmMessageEntry,
  createBashToolReasoningEntry,
} from './helpers/bash-tool-transform-helper';

// Type-safe key extraction from the schema
const COMMANDS_KEY = 'commands' as const satisfies keyof BashToolInput;

export function createBashToolDelta(state: BashToolState, context: BashToolContext) {
  return async function bashToolDelta(
    options: { inputTextDelta: string } & ToolCallOptions
  ): Promise<void> {
    // Accumulate the delta to the args
    state.args = (state.args || '') + options.inputTextDelta;

    // Use optimistic parsing to extract values even from incomplete JSON
    const parseResult = OptimisticJsonParser.parse(state.args);

    // Extract commands from the optimistically parsed values
    const rawCommands = getOptimisticValue<unknown>(parseResult.extractedValues, COMMANDS_KEY, []);

    // Ensure commands is an array of command objects
    let commands: Array<{ command: string; description?: string; timeout?: number }> = [];
    if (Array.isArray(rawCommands)) {
      commands = rawCommands.filter(
        (cmd): cmd is { command: string; description?: string; timeout?: number } =>
          typeof cmd === 'object' &&
          cmd !== null &&
          'command' in cmd &&
          typeof cmd.command === 'string'
      );
    }

    // Update state with parsed commands
    if (commands.length > 0) {
      state.commands = commands;
    }

    // Update reasoning entry with current state (but keep status as loading)
    const reasoningEntry = createBashToolReasoningEntry(state, options.toolCallId);
    const rawLlmMessage = createBashToolRawLlmMessageEntry(state, options.toolCallId);

    if (reasoningEntry && rawLlmMessage) {
      try {
        await updateMessageEntries({
          messageId: context.messageId,
          reasoningEntry,
          rawLlmMessage,
          mode: 'update',
        });
      } catch (error) {
        console.error('[bash-tool] Failed to update entries during delta:', {
          messageId: context.messageId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  };
}
