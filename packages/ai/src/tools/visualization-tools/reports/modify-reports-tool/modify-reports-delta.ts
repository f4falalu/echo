import { batchUpdateReport, db, reportFiles, updateMessageEntries } from '@buster/database';
import type { ChatMessageResponseMessage } from '@buster/server-shared/chats';
import type { ToolCallOptions } from 'ai';
import { and, eq, isNull } from 'drizzle-orm';
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

      // Update report metadata and fetch snapshot when ID is first received
      if (id && !state.reportId) {
        state.reportId = id;

        // Fetch the report snapshot immediately when we get the ID
        try {
          const existingReport = await db
            .select({
              content: reportFiles.content,
            })
            .from(reportFiles)
            .where(and(eq(reportFiles.id, id), isNull(reportFiles.deletedAt)))
            .limit(1);

          if (existingReport.length > 0 && existingReport[0]) {
            state.snapshotContent = existingReport[0].content;
            console.info('[modify-reports-delta] Fetched report snapshot', { reportId: id });
          } else {
            console.error('[modify-reports-delta] Report not found', { reportId: id });
          }
        } catch (error) {
          console.error('[modify-reports-delta] Error fetching report snapshot:', error);
        }
      }

      // Update report name immediately when available
      if (name && state.reportName !== name) {
        state.reportName = name;

        // If we have a snapshot and report ID, update the name in the database
        if (state.snapshotContent !== undefined && state.reportId) {
          try {
            // We need to provide content for batchUpdateReport, so use the snapshot
            await batchUpdateReport({
              reportId: state.reportId,
              content: state.snapshotContent,
              name: name,
            });
            console.info('[modify-reports-delta] Updated report name', {
              reportId: state.reportId,
              name,
            });
          } catch (error) {
            console.error('[modify-reports-delta] Error updating report name:', error);
          }
        }
      }

      // Validate that we have a complete UUID before processing edits
      // UUID format: 8-4-4-4-12 characters (36 total with hyphens)
      const isValidUUID = (uuid: string): boolean => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
      };

      // Process edits with streaming - only if we have a valid UUID and snapshot
      if (
        editsArray &&
        Array.isArray(editsArray) &&
        state.reportId &&
        isValidUUID(state.reportId) &&
        state.snapshotContent !== undefined
      ) {
        // Initialize state edits if needed
        if (!state.edits) {
          state.edits = [];
        }

        // Process each edit and apply to database in real-time
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
                  existingEdit.operation = operation;
                  existingEdit.code_to_replace = codeToReplace || '';
                  existingEdit.code = code;
                }
              }

              // Apply the edit to the snapshot and update database in real-time
              // Only process the first edit for now (multiple edits would need careful handling)
              if (index === 0) {
                let newContent = state.snapshotContent;

                if (operation === 'append') {
                  // For append, add the streaming code to the end of the snapshot
                  newContent = state.snapshotContent + code;
                } else if (operation === 'replace' && codeToReplace) {
                  // For replace, substitute in the snapshot
                  if (state.snapshotContent.includes(codeToReplace)) {
                    newContent = state.snapshotContent.replace(codeToReplace, code);
                  }
                }

                // Update the database with the new content
                try {
                  await batchUpdateReport({
                    reportId: state.reportId,
                    content: newContent,
                    name: state.reportName || undefined,
                  });

                  // Update state with the final content
                  state.finalContent = newContent;

                  // Create response message if not already created
                  if (!state.responseMessageCreated && context.messageId) {
                    const responseMessages: ChatMessageResponseMessage[] = [
                      {
                        id: state.reportId,
                        type: 'file' as const,
                        file_type: 'report' as const,
                        file_name: state.reportName || 'Untitled Report',
                        version_number: 2, // This would need proper version tracking
                        filter_version_id: null,
                        metadata: [
                          {
                            status: 'completed' as const,
                            message: 'Report modified successfully',
                            timestamp: Date.now(),
                          },
                        ],
                      },
                    ];

                    await updateMessageEntries({
                      messageId: context.messageId,
                      responseMessages,
                    });

                    state.responseMessageCreated = true;
                    console.info(
                      '[modify-reports-delta] Created response message during streaming'
                    );
                  }
                } catch (error) {
                  console.error('[modify-reports-delta] Error updating report content:', error);
                  if (state.edits) {
                    const edit = state.edits[index];
                    if (edit) {
                      edit.status = 'failed';
                      edit.error = error instanceof Error ? error.message : 'Update failed';
                    }
                  }
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
