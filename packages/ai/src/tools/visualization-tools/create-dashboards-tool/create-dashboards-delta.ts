import { updateMessageEntries } from '@buster/database';
import type { ChatMessageReasoningMessage } from '@buster/server-shared/chats';
import type { ToolCallOptions } from 'ai';
import {
  OptimisticJsonParser,
  getOptimisticValue,
} from '../../../utils/streaming/optimistic-json-parser';
import type {
  CreateDashboardsContext,
  CreateDashboardsFile,
  CreateDashboardsState,
} from './create-dashboards-tool';
import {
  TOOL_KEYS,
  createDashboardsReasoningMessage,
} from './helpers/create-dashboards-tool-transform-helper';

export function createCreateDashboardsDelta(
  context: CreateDashboardsContext,
  state: CreateDashboardsState
) {
  return async (options: { inputTextDelta: string } & ToolCallOptions) => {
    // Handle string deltas (accumulate JSON text)
    state.argsText += options.inputTextDelta;

    // Try to parse the accumulated JSON
    const parseResult = OptimisticJsonParser.parse(state.argsText || '');

    if (parseResult.parsed) {
      // Extract files array from parsed result
      const filesArray = getOptimisticValue<unknown[]>(
        parseResult.extractedValues,
        TOOL_KEYS.files,
        []
      );

      if (filesArray && Array.isArray(filesArray)) {
        // Update state files with streamed data
        const updatedFiles: CreateDashboardsFile[] = [];

        filesArray.forEach((file) => {
          if (file && typeof file === 'object') {
            const fileObj = file as Record<string, unknown>;
            const name = getOptimisticValue<string>(
              new Map(Object.entries(fileObj)),
              TOOL_KEYS.name,
              ''
            );
            const ymlContent = getOptimisticValue<string>(
              new Map(Object.entries(fileObj)),
              TOOL_KEYS.yml_content,
              ''
            );

            if (name && ymlContent) {
              updatedFiles.push({
                name,
                yml_content: ymlContent,
                status: 'processing',
              });
            }
          }
        });

        state.files = updatedFiles;
      }
    }

    // Update database ONLY if both context.messageId AND state.reasoningEntryId exist
    if (context.messageId && state.toolCallId) {
      try {
        // Filter out undefined entries
        if (state.files) {
          const validFiles = state.files.filter((f) => f);

          if (validFiles.length > 0) {
            const reasoningMessage = createDashboardsReasoningMessage(
              state.toolCallId || `tool-${Date.now()}`,
              validFiles,
              'loading'
            );

            await updateMessageEntries({
              messageId: context.messageId,
              responseEntry: reasoningMessage as ChatMessageReasoningMessage,
              mode: 'update',
            });
          }
        }
      } catch (error) {
        console.error('[create-dashboards] Error updating reasoning entry during delta:', error);
        // Don't throw - continue processing
      }
    }
  };
}
