import { updateMessageEntries } from '@buster/database';
import type { ToolCallOptions } from 'ai';
import {
  OptimisticJsonParser,
  getOptimisticValue,
} from '../../../../utils/streaming/optimistic-json-parser';
import {
  createModifyReportsRawLlmMessageEntry,
  createModifyReportsReasoningEntry,
} from './helpers/modify-reports-transform-helper';
import type { ModifyReportsContext, ModifyReportsState } from './modify-reports-tool';

// Define TOOL_KEYS locally
const TOOL_KEYS = {
  id: 'id' as const,
  name: 'name' as const,
  edits: 'edits' as const,
  code_to_replace: 'code_to_replace' as const,
  code: 'code' as const,
};

export function createModifyReportsDelta(context: ModifyReportsContext, state: ModifyReportsState) {
  return async (options: { inputTextDelta: string } & ToolCallOptions) => {
    // Handle string deltas (accumulate JSON text)
    state.argsText = (state.argsText || '') + options.inputTextDelta;

    // Parse the accumulated JSON to extract information
    const parser = new OptimisticJsonParser();
    const optimisticArgs = parser.parse(state.argsText || '') as Record<string, any>;

    // Track parsed args for processing
    if (optimisticArgs) {
      const id = getOptimisticValue(optimisticArgs, TOOL_KEYS.id) as string | undefined;
      const name = getOptimisticValue(optimisticArgs, TOOL_KEYS.name) as string | undefined;
      const edits = getOptimisticValue(optimisticArgs, TOOL_KEYS.edits) as any[] | undefined;

      // Update report metadata
      if (id) {
        state.reportId = id;
      }
      if (name) {
        state.reportName = name;
      }

      // Process edits
      if (edits && edits.length > 0) {
        // Initialize state edits if needed
        if (!state.edits) {
          state.edits = [];
        }

        // Add or update edits in state
        for (let i = 0; i < edits.length; i++) {
          const edit = edits[i];
          if (edit) {
            const operation = edit.code_to_replace === '' ? 'append' : 'replace';

            if (state.edits[i]) {
              // Update existing edit
              state.edits[i] = {
                operation,
                code_to_replace: edit.code_to_replace,
                code: edit.code,
                status: 'loading',
              };
            } else {
              // Add new edit
              state.edits.push({
                operation,
                code_to_replace: edit.code_to_replace,
                code: edit.code,
                status: 'loading',
              });
            }
          }
        }
      }
    }

    // Update database entries with current state
    if (context.messageId && state.toolCallId) {
      try {
        const reasoningEntry = createModifyReportsReasoningEntry(state, state.toolCallId);
        const rawLlmMessage = createModifyReportsRawLlmMessageEntry(state, state.toolCallId);

        const updates: Parameters<typeof updateMessageEntries>[0] = {
          messageId: context.messageId,
          mode: 'update',
        };

        if (reasoningEntry) {
          updates.responseEntry = reasoningEntry;
        }

        if (rawLlmMessage) {
          updates.rawLlmMessage = rawLlmMessage;
        }

        if (reasoningEntry || rawLlmMessage) {
          await updateMessageEntries(updates);
        }
      } catch (error) {
        console.error('[modify-reports] Error updating entries on delta:', error);
      }
    }
  };
}
