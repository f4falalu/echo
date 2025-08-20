import { getReportContent, updateMessageEntries, updateReportContent } from '@buster/database';
import type { ChatMessageResponseMessage } from '@buster/server-shared/chats';
import type { ToolCallOptions } from 'ai';
import {
  OptimisticJsonParser,
  getOptimisticValue,
} from '../../../../utils/streaming/optimistic-json-parser';
import { reportContainsMetrics } from '../helpers/report-metric-helper';
import {
  createModifyReportsRawLlmMessageEntry,
  createModifyReportsReasoningEntry,
} from './helpers/modify-reports-transform-helper';
import type {
  ModifyReportsContext,
  ModifyReportsEditState,
  ModifyReportsInput,
  ModifyReportsState,
  ModifyReportsStreamingEdit,
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

// Helper to check if code_to_replace is completely streamed
function isCodeToReplaceComplete(editObj: Record<string, unknown>, codeToReplace: string): boolean {
  // Check if the string ends properly (not mid-token)
  // We consider it complete if it has the expected value and doesn't end with incomplete JSON
  const value = editObj.code_to_replace as string;
  return value === codeToReplace && !value.endsWith('\\');
}

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
        if (!state.streamingEdits) {
          state.streamingEdits = [];
        }

        // Track response messages to create
        const responseMessagesToCreate: ChatMessageResponseMessage[] = [];

        // Process each edit with streaming updates
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

              // Update state edit
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
                  existingEdit.code_to_replace = codeToReplace || '';
                  existingEdit.code = code;
                }
              }

              // Initialize streaming edit if needed
              if (!state.streamingEdits[index]) {
                state.streamingEdits[index] = {
                  operation,
                  codeToReplaceComplete: false,
                  streamingCode: '',
                  lastUpdateIndex: 0,
                };
              }

              const streamingEdit = state.streamingEdits[index];
              if (!streamingEdit) continue;

              // Initialize snapshot on first edit if needed
              if (index === 0 && !state.snapshotContent) {
                const currentContent = await getReportContent({ reportId: state.reportId });
                state.snapshotContent = currentContent || '';
                state.workingContent = state.snapshotContent; // Track working content for sequential edits
                // Initialize version number (will be updated in execute phase)
                if (!state.version_number) {
                  state.version_number = 1;
                }
              }

              // Only process if this edit has new content to stream
              if (code.length > streamingEdit.lastUpdateIndex) {
                // Build content sequentially by applying all edits up to current index
                let workingContent = state.snapshotContent || '';

                // Apply all previous edits first (they should be complete)
                for (let i = 0; i < index; i++) {
                  const prevEdit = editsArray[i];
                  if (prevEdit && typeof prevEdit === 'object') {
                    const prevEditObj = prevEdit as Record<string, unknown>;
                    const prevEditMap = new Map(Object.entries(prevEditObj));
                    const prevOperation =
                      getOptimisticValue<string>(prevEditMap, TOOL_KEYS.operation, '') ||
                      (getOptimisticValue<string>(prevEditMap, TOOL_KEYS.code_to_replace, '') === ''
                        ? 'append'
                        : 'replace');
                    const prevCodeToReplace = getOptimisticValue<string>(
                      prevEditMap,
                      TOOL_KEYS.code_to_replace,
                      ''
                    );
                    const prevCode = getOptimisticValue<string>(prevEditMap, TOOL_KEYS.code, '');

                    if (prevOperation === 'append') {
                      workingContent = workingContent + prevCode;
                    } else if (
                      prevOperation === 'replace' &&
                      prevCodeToReplace &&
                      workingContent.includes(prevCodeToReplace)
                    ) {
                      workingContent = workingContent.replace(prevCodeToReplace, prevCode || '');
                    }
                  }
                }

                // Now apply the current edit based on its operation
                let newContent = workingContent;

                if (operation === 'append') {
                  // APPEND: Stream directly as content comes in
                  newContent = workingContent + code;
                } else if (operation === 'replace') {
                  // REPLACE: Wait for code_to_replace to be complete, then stream replacements
                  if (!streamingEdit.codeToReplaceComplete) {
                    streamingEdit.codeToReplaceComplete = isCodeToReplaceComplete(
                      editObj,
                      codeToReplace || ''
                    );
                  }

                  if (streamingEdit.codeToReplaceComplete) {
                    if (workingContent.includes(codeToReplace || '')) {
                      newContent = workingContent.replace(codeToReplace || '', code);
                    } else {
                      // If replace text not found, skip updating
                      continue;
                    }
                  } else {
                    // Wait for code_to_replace to complete
                    continue;
                  }
                }

                // Update the report content with all edits applied
                try {
                  await updateReportContent({
                    reportId: state.reportId,
                    content: newContent,
                  });

                  // Update state
                  state.currentContent = newContent;
                  state.workingContent = newContent;
                  streamingEdit.lastUpdateIndex = code.length;
                  streamingEdit.streamingCode = code;

                  // Check for metrics if not already created response message
                  if (reportContainsMetrics(newContent) && !state.responseMessageCreated) {
                    responseMessagesToCreate.push({
                      id: state.reportId,
                      type: 'file' as const,
                      file_type: 'report' as const,
                      file_name: state.reportName || '',
                      version_number: state.version_number || 1,
                      filter_version_id: null,
                      metadata: [
                        {
                          status: 'completed' as const,
                          message: 'Report modified successfully',
                          timestamp: Date.now(),
                        },
                      ],
                    });
                    state.responseMessageCreated = true;
                  }
                } catch (error) {
                  console.error(
                    '[modify-reports] Error updating report content during streaming:',
                    error
                  );
                }
              }
            }
          }
        }

        // Update database with response messages if we have any
        if (responseMessagesToCreate.length > 0 && context.messageId) {
          try {
            await updateMessageEntries({
              messageId: context.messageId,
              responseMessages: responseMessagesToCreate,
            });

            console.info('[modify-reports] Created response message during delta', {
              reportId: state.reportId,
            });
          } catch (error) {
            console.error('[modify-reports] Error creating response message during delta:', error);
            // Don't throw - continue processing
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
