import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import type { DoneToolContext, DoneToolInput, DoneToolState } from './done-tool';
import {
  createDoneToolRawLlmMessageEntry,
  createDoneToolResponseMessage,
} from './helpers/done-tool-transform-helper';

export function createDoneToolFinish(doneToolState: DoneToolState, context: DoneToolContext) {
  return async function doneToolFinish(
    options: { input: DoneToolInput } & ToolCallOptions
  ): Promise<void> {
    doneToolState.entry_id = options.toolCallId;

    const doneToolResponseEntry = createDoneToolResponseMessage(doneToolState, options.toolCallId);
    const doneToolMessage = createDoneToolRawLlmMessageEntry(doneToolState, options.toolCallId);

    try {
      if (doneToolMessage) {
        await updateMessageEntries({
          messageId: context.messageId,
          responseEntry: doneToolResponseEntry,
          rawLlmMessage: doneToolMessage,
          mode: 'update',
        });
      }
    } catch (error) {
      console.error('[done-tool] Failed to update done tool raw LLM message:', error);
    }
  };
}
