import { type UpdateMessageEntriesParams, updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import {
  createRespondWithoutAssetCreationRawLlmMessageEntry,
  createRespondWithoutAssetCreationResponseMessage,
} from './helpers/respond-without-asset-creation-transform-helper';
import type {
  RespondWithoutAssetCreationContext,
  RespondWithoutAssetCreationInput,
  RespondWithoutAssetCreationState,
} from './respond-without-asset-creation-tool';

export function createRespondWithoutAssetCreationFinish<
  TAgentContext extends RespondWithoutAssetCreationContext,
>(state: RespondWithoutAssetCreationState, context: TAgentContext) {
  return async function respondWithoutAssetCreationFinish(
    options: { input: RespondWithoutAssetCreationInput } & ToolCallOptions
  ): Promise<void> {
    state.entry_id = options.toolCallId;
    state.final_response = options.input.final_response;

    const responseEntry = createRespondWithoutAssetCreationResponseMessage(
      state,
      options.toolCallId
    );
    const rawLlmMessage = createRespondWithoutAssetCreationRawLlmMessageEntry(
      state,
      options.toolCallId
    );

    const entries: UpdateMessageEntriesParams = {
      messageId: context.messageId,
    };

    if (responseEntry) {
      entries.responseMessages = [responseEntry];
    }

    if (rawLlmMessage) {
      entries.rawLlmMessages = [rawLlmMessage];
    }

    // Only update database if we have a valid messageId
    if (context.messageId) {
      try {
        if (entries.responseMessages || entries.rawLlmMessages) {
          await updateMessageEntries(entries);
        }
      } catch (error) {
        console.error('[respond-without-asset-creation] Failed to update final entries:', error);
      }
    }
  };
}
