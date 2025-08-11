import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import {
  OptimisticJsonParser,
  getOptimisticValue,
} from '../../../../utils/streaming/optimistic-json-parser';
import type {
  CreateDashboardsContext,
  CreateDashboardsReasoningFile,
  CreateDashboardsState,
} from './create-dashboards-tool';
import {
  createCreateDashboardsRawLlmMessageEntry,
  createCreateDashboardsReasoningEntry,
} from './helpers/create-dashboards-tool-transform-helper';

// Define TOOL_KEYS locally since we removed them from the helper
const TOOL_KEYS = {
  files: 'files' as const,
  name: 'name' as const,
  yml_content: 'yml_content' as const,
};

export function createCreateDashboardsDelta(
  context: CreateDashboardsContext,
  state: CreateDashboardsState
) {
  return async (options: { inputTextDelta: string } & ToolCallOptions) => {
    // Handle string deltas (accumulate JSON text)
    state.argsText = (state.argsText || '') + options.inputTextDelta;

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
        const updatedFiles: CreateDashboardsReasoningFile[] = [];

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
        
        // Also update parsedArgs as we stream for raw LLM message
        if (updatedFiles.length > 0) {
          state.parsedArgs = {
            files: updatedFiles.map(f => ({
              name: f.name,
              yml_content: f.yml_content,
            })),
          };
        }
      }
    }

    // Update database with both reasoning and raw LLM entries
    if (context.messageId && state.toolCallId) {
      try {
        const reasoningEntry = createCreateDashboardsReasoningEntry(state, options.toolCallId);
        const rawLlmMessage = createCreateDashboardsRawLlmMessageEntry(state, options.toolCallId);

        // Update both entries together if they exist
        const updates: Parameters<typeof updateMessageEntries>[0] = {
          messageId: context.messageId,
          mode: 'update',
        };

        if (reasoningEntry) {
          updates.responseEntry = reasoningEntry;
        }

        if (rawLlmMessage) {
          updates.rawLlmMessageEntry = rawLlmMessage;
        }

        if (reasoningEntry || rawLlmMessage) {
          await updateMessageEntries(updates);
        }
      } catch (error) {
        console.error('[create-dashboards] Error updating entries during delta:', error);
        // Don't throw - continue processing
      }
    }
  };
}
