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
import type {
  ModifyReportsContext,
  ModifyReportsEditState,
  ModifyReportsInput,
  ModifyReportsState,
} from './modify-reports-tool';

// Define TOOL_KEYS locally since we removed them from the helper
const TOOL_KEYS = {
  id: 'id' as const,
  name: 'name' as const,
  edits: 'edits' as const,
  code_to_replace: 'code_to_replace' as const,
  code: 'code' as const,
} satisfies {
  id: keyof ModifyReportsInput;
  name: keyof ModifyReportsInput;
  edits: keyof ModifyReportsInput;
  code_to_replace: keyof ModifyReportsInput['edits'][number];
  code: keyof ModifyReportsInput['edits'][number];
};

export function createModifyReportsDelta(context: ModifyReportsContext, state: ModifyReportsState) {
  return async (options: { inputTextDelta: string } & ToolCallOptions) => {
    // Handle string deltas (accumulate JSON text)
    state.argsText = (state.argsText || '') + options.inputTextDelta;

    // Try to parse the accumulated JSON
    const parseResult = OptimisticJsonParser.parse(state.argsText || '');

    if (parseResult.parsed) {
      // Extract values from parsed result
      const id = getOptimisticValue<string>(parseResult.extractedValues, TOOL_KEYS.id, '');
      const name = getOptimisticValue<string>(parseResult.extractedValues, TOOL_KEYS.name, '');
      const editsArray = getOptimisticValue<unknown[]>(
        parseResult.extractedValues,
        TOOL_KEYS.edits,
        []
      );

      // Update report metadata
      if (id) {
        state.reportId = id;
      }
      if (name) {
        state.reportName = name;
      }

      // Process edits
      if (editsArray && Array.isArray(editsArray)) {
        // Initialize state edits if needed
        if (!state.edits) {
          state.edits = [];
        }

        // Update state edits with streamed data
        const updatedEdits: ModifyReportsEditState[] = [];

        editsArray.forEach((edit, index) => {
          if (edit && typeof edit === 'object') {
            const editObj = edit as Record<string, unknown>;
            const codeToReplace = getOptimisticValue<string>(
              new Map(Object.entries(editObj)),
              TOOL_KEYS.code_to_replace,
              ''
            );
            const code = getOptimisticValue<string>(
              new Map(Object.entries(editObj)),
              TOOL_KEYS.code,
              ''
            );

            if (code !== undefined) {
              const operation = codeToReplace === '' ? 'append' : 'replace';
              updatedEdits.push({
                operation,
                code_to_replace: codeToReplace || '',
                code,
                status: 'loading',
              });
            }
          }
        });

        state.edits = updatedEdits;
      }
    }

    // Update database with both reasoning and raw LLM entries
    if (context.messageId && state.toolCallId) {
      try {
        const reasoningEntry = createModifyReportsReasoningEntry(state, options.toolCallId);
        const rawLlmMessage = createModifyReportsRawLlmMessageEntry(state, options.toolCallId);

        // Update both entries together if they exist
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
        console.error('[modify-reports] Error updating entries during delta:', error);
        // Don't throw - continue processing
      }
    }
  };
}
