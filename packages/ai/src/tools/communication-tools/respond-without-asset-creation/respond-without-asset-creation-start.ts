import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import {
  createRespondWithoutAssetCreationRawLlmMessageEntry,
  createRespondWithoutAssetCreationResponseMessage,
} from './helpers/respond-without-asset-creation-transform-helper';
import type {
  RespondWithoutAssetCreationContext,
  RespondWithoutAssetCreationState,
} from './respond-without-asset-creation-tool';

// Factory function that creates a type-safe callback for the specific agent context
export function createRespondWithoutAssetCreationStart<
  TAgentContext extends RespondWithoutAssetCreationContext,
>(state: RespondWithoutAssetCreationState, context: TAgentContext) {
  return async function respondWithoutAssetCreationStart(
    options: Pick<ToolCallOptions, 'toolCallId'>
  ): Promise<void> {
    state.entry_id = options.toolCallId;

    const responseEntry = createRespondWithoutAssetCreationResponseMessage(
      state,
      options.toolCallId
    );
    const rawLlmMessage = createRespondWithoutAssetCreationRawLlmMessageEntry(
      state,
      options.toolCallId
    );

    // Only update database if we have a valid messageId
    if (context.messageId) {
      try {
        if (rawLlmMessage) {
          await updateMessageEntries({
            messageId: context.messageId,
            responseEntry: responseEntry,
            rawLlmMessage: rawLlmMessage,
            toolCallId: options.toolCallId,
          });
        }
      } catch (error) {
        console.error('[respond-without-asset-creation] Failed to update initial entries:', error);
      }
    }
  };
}
