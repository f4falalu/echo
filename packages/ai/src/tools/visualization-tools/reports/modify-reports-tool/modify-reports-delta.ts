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
  operation: 'operation' as const,
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
      if (id && !state.reportId) {
        state.reportId = id;
      }
      if (name && !state.reportName) {
        state.reportName = name;
      }

      // Validate that we have a complete UUID before processing edits
      // UUID format: 8-4-4-4-12 characters (36 total with hyphens)
      const isValidUUID = (uuid: string): boolean => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
      };

      // Process edits with streaming - only if we have a valid UUID
      if (
        editsArray &&
        Array.isArray(editsArray) &&
        state.reportId &&
        isValidUUID(state.reportId)
      ) {
        // Initialize state edits if needed
        if (!state.edits) {
          state.edits = [];
        }

        // Process each edit and update state only (no database updates)
        for (let index = 0; index < editsArray.length; index++) {
          const edit = editsArray[index];
          if (edit && typeof edit === 'object') {
            const editObj = edit as Record<string, unknown>;
            const editMap = new Map(Object.entries(editObj));

            const operationValue = getOptimisticValue<string>(editMap, TOOL_KEYS.operation, '');
            const codeToReplace = getOptimisticValue<string>(
              editMap,
              TOOL_KEYS.code_to_replace,
              ''
            );
            const code = getOptimisticValue<string>(editMap, TOOL_KEYS.code, '');

            if (code !== undefined) {
              // Use explicit operation if provided, otherwise infer from code_to_replace
              const operation =
                operationValue === 'append' || operationValue === 'replace'
                  ? operationValue
                  : codeToReplace === ''
                    ? 'append'
                    : 'replace';

              // Update state edit - just track the edits, don't apply them
              if (!state.edits[index]) {
                state.edits[index] = {
                  operation,
                  code_to_replace: codeToReplace || '',
                  code,
                  status: 'loading',
                };
              } else {
                // Update existing edit
                const existingEdit = state.edits[index];
                if (existingEdit) {
                  existingEdit.operation = operation;
                  existingEdit.code_to_replace = codeToReplace || '';
                  existingEdit.code = code;
                }
              }
            }
          }
        }
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
        };

        if (reasoningEntry) {
          updates.reasoningMessages = [reasoningEntry];
        }

        if (rawLlmMessage) {
          updates.rawLlmMessages = [rawLlmMessage];
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
