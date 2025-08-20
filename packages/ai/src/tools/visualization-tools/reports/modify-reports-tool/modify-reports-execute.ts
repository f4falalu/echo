import { batchUpdateReport, db, reportFiles, updateMessageEntries } from '@buster/database';
import type { ChatMessageResponseMessage } from '@buster/server-shared/chats';
import { wrapTraced } from 'braintrust';
import { and, eq, isNull } from 'drizzle-orm';
import { createRawToolResultEntry } from '../../../shared/create-raw-llm-tool-result-entry';
import { trackFileAssociations } from '../../file-tracking-helper';
import { reportContainsMetrics } from '../helpers/report-metric-helper';
import { shouldIncrementVersion, updateVersionHistory } from '../helpers/report-version-helper';
import {
  createModifyReportsRawLlmMessageEntry,
  createModifyReportsReasoningEntry,
} from './helpers/modify-reports-transform-helper';
import type {
  ModifyReportsContext,
  ModifyReportsInput,
  ModifyReportsOutput,
  ModifyReportsState,
} from './modify-reports-tool';
import { MODIFY_REPORTS_TOOL_NAME } from './modify-reports-tool';

// Apply a single edit operation to content in memory
function applyEditToContent(
  content: string,
  edit: { code_to_replace: string; code: string }
): {
  success: boolean;
  content?: string;
  error?: string;
} {
  try {
    if (edit.code_to_replace === '') {
      // Append mode
      return {
        success: true,
        content: content + edit.code,
      };
    }
    // Replace mode
    if (!content.includes(edit.code_to_replace)) {
      return {
        success: false,
        error: `Text not found: "${edit.code_to_replace.substring(0, 50)}${edit.code_to_replace.length > 50 ? '...' : ''}"`,
      };
    }
    const newContent = content.replace(edit.code_to_replace, edit.code);
    return {
      success: true,
      content: newContent,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Edit operation failed',
    };
  }
}

type VersionHistoryEntry = {
  content: string;
  updated_at: string;
  version_number: number;
};

type VersionHistory = Record<string, VersionHistoryEntry>;

// Process all edit operations sequentially in memory
async function processEditOperations(
  reportId: string,
  reportName: string,
  edits: Array<{ code_to_replace: string; code: string }>,
  messageId?: string,
  state?: ModifyReportsState
): Promise<{
  success: boolean;
  finalContent?: string;
  errors: string[];
  version?: number;
  versionHistory?: VersionHistory;
  incrementVersion?: boolean;
}> {
  // Get current report content and version history
  const existingReport = await db
    .select({
      content: reportFiles.content,
      versionHistory: reportFiles.versionHistory,
    })
    .from(reportFiles)
    .where(and(eq(reportFiles.id, reportId), isNull(reportFiles.deletedAt)))
    .limit(1);

  if (!existingReport.length) {
    return {
      success: false,
      errors: ['Report not found'],
    };
  }

  const report = existingReport[0];
  if (!report) {
    return {
      success: false,
      errors: ['Report not found'],
    };
  }

  let currentContent = report.content;
  const errors: string[] = [];
  let allSuccess = true;

  // Apply all edits in memory
  for (const [index, edit] of edits.entries()) {
    // Update state edit status to processing
    const editState = state?.edits?.[index];
    if (editState) {
      editState.status = 'loading';
    }

    const result = applyEditToContent(currentContent, edit);

    if (result.success && result.content) {
      currentContent = result.content;

      // Update state edit status to completed
      const completedEditState = state?.edits?.[index];
      if (completedEditState) {
        completedEditState.status = 'completed';
      }

      // Update state current content
      if (state) {
        state.currentContent = currentContent;
      }
    } else {
      allSuccess = false;
      const operation = edit.code_to_replace === '' ? 'append' : 'replace';
      const errorMsg = `Edit ${index + 1} (${operation}): ${result.error || 'Unknown error'}`;
      errors.push(errorMsg);

      // Update state edit status to failed
      const failedEditState = state?.edits?.[index];
      if (failedEditState) {
        failedEditState.status = 'failed';
        failedEditState.error = result.error || 'Unknown error';
      }
      // Stop processing on first failure for consistency
      break;
    }
  }

  if (!allSuccess || currentContent === report.content) {
    return {
      success: allSuccess,
      finalContent: currentContent,
      errors,
    };
  }

  // Determine if we should increment version
  const incrementVersion = await shouldIncrementVersion(reportId, messageId);
  const { versionHistory, newVersionNumber } = updateVersionHistory(
    report.versionHistory as VersionHistory | null,
    currentContent,
    incrementVersion
  );

  // Write all changes to database in one operation
  try {
    await batchUpdateReport({
      reportId,
      content: currentContent,
      name: reportName,
      versionHistory,
    });

    if (state) {
      state.finalContent = currentContent;
      state.version_number = newVersionNumber;
    }

    return {
      success: true,
      finalContent: currentContent,
      errors: [],
      version: newVersionNumber,
      versionHistory,
      incrementVersion, // Include this so we know if version was incremented
    };
  } catch (error) {
    console.error('[modify-reports] Error updating report:', error);
    return {
      success: false,
      finalContent: currentContent,
      errors: [error instanceof Error ? error.message : 'Failed to save changes'],
    };
  }
}

// Main modify reports function
const modifyReportsFile = wrapTraced(
  async (
    params: ModifyReportsInput,
    context: ModifyReportsContext,
    state?: ModifyReportsState
  ): Promise<ModifyReportsOutput> => {
    // Get context values
    const userId = context.userId;
    const organizationId = context.organizationId;
    const messageId = context.messageId;

    if (!userId) {
      return {
        success: false,
        message: 'Unable to verify your identity. Please log in again.',
        file: {
          id: params.id,
          name: params.name,
          content: '',
          version_number: 0,
          updated_at: new Date().toISOString(),
        },
        error: 'User authentication required',
      };
    }

    if (!organizationId) {
      return {
        success: false,
        message: 'Unable to access your organization. Please check your permissions.',
        file: {
          id: params.id,
          name: params.name,
          content: '',
          version_number: 0,
          updated_at: new Date().toISOString(),
        },
        error: 'Organization access required',
      };
    }

    // Validate report ID
    if (!params.id) {
      return {
        success: false,
        message: 'Report ID is required for editing.',
        file: {
          id: '',
          name: params.name,
          content: '',
          version_number: 0,
          updated_at: new Date().toISOString(),
        },
        error: 'Missing report ID',
      };
    }

    // Process all edit operations
    const editResult = await processEditOperations(
      params.id,
      params.name,
      params.edits,
      messageId,
      state
    );

    // Track file associations if this is a new version (not part of same turn)
    if (messageId && editResult.success && editResult.finalContent && editResult.incrementVersion) {
      await trackFileAssociations({
        messageId,
        files: [
          {
            id: params.id,
            version: editResult.version || 2,
          },
        ],
      });
    }

    const now = new Date().toISOString();

    if (editResult.success && editResult.finalContent) {
      return {
        success: true,
        message: `Successfully applied ${params.edits.length} edit(s) to report: ${params.name}`,
        file: {
          id: params.id,
          name: params.name,
          content: editResult.finalContent,
          version_number: editResult.version || 2,
          updated_at: now,
        },
      };
    }
    if (editResult.finalContent) {
      // Partial success
      return {
        success: false,
        message: `Partially applied edits to report: ${params.name}. Some operations failed.`,
        file: {
          id: params.id,
          name: params.name,
          content: editResult.finalContent,
          version_number: editResult.version || 2,
          updated_at: now,
        },
        error: editResult.errors.join('; '),
      };
    }
    // Complete failure
    return {
      success: false,
      message: `Failed to edit report: ${params.name}`,
      file: {
        id: params.id,
        name: params.name,
        content: '',
        version_number: 0,
        updated_at: now,
      },
      error: editResult.errors.join('; ') || 'All edit operations failed',
    };
  },
  { name: 'Modify Reports File' }
);

export function createModifyReportsExecute(
  context: ModifyReportsContext,
  state: ModifyReportsState
) {
  return wrapTraced(
    async (input: ModifyReportsInput): Promise<ModifyReportsOutput> => {
      const startTime = Date.now();

      try {
        // Call the main function directly, passing state
        const result = await modifyReportsFile(input, context, state);

        // Update state with final results
        if (result && typeof result === 'object') {
          const typedResult = result as ModifyReportsOutput;

          // Update final status in state
          if (state.edits) {
            const finalStatus = typedResult.success ? 'completed' : 'failed';
            state.edits.forEach((edit) => {
              if (edit.status === 'loading') {
                edit.status = finalStatus;
              }
            });
          }

          // Update last entries if we have a messageId
          if (context.messageId) {
            try {
              const toolCallId = state.toolCallId || `tool-${Date.now()}`;

              // Check if the modified report contains metrics
              const responseMessages: ChatMessageResponseMessage[] = [];

              // Only add to response messages if modification was successful AND report contains metrics
              if (
                typedResult.success &&
                typedResult.file &&
                reportContainsMetrics(typedResult.file.content)
              ) {
                responseMessages.push({
                  id: typedResult.file.id,
                  type: 'file' as const,
                  file_type: 'report' as const,
                  file_name: typedResult.file.name,
                  version_number: typedResult.file.version_number || 1,
                  filter_version_id: null,
                  metadata: [
                    {
                      status: 'completed' as const,
                      message: 'Report modified successfully',
                      timestamp: Date.now(),
                    },
                  ],
                });
              }

              const reasoningEntry = createModifyReportsReasoningEntry(state, toolCallId);
              const rawLlmMessage = createModifyReportsRawLlmMessageEntry(state, toolCallId);
              const rawLlmResultEntry = createRawToolResultEntry(
                toolCallId,
                MODIFY_REPORTS_TOOL_NAME,
                {
                  edits: state.edits,
                }
              );

              const updates: Parameters<typeof updateMessageEntries>[0] = {
                messageId: context.messageId,
              };

              if (reasoningEntry) {
                updates.reasoningMessages = [reasoningEntry];
              }

              if (rawLlmMessage) {
                updates.rawLlmMessages = [rawLlmMessage, rawLlmResultEntry];
              }

              // Only add responseMessages if there are reports with metrics
              if (responseMessages.length > 0) {
                updates.responseMessages = responseMessages;
              }

              if (reasoningEntry || rawLlmMessage || responseMessages.length > 0) {
                await updateMessageEntries(updates);
              }

              console.info('[modify-reports] Updated last entries with final results', {
                messageId: context.messageId,
                success: typedResult.success,
                editsApplied: state.edits?.filter((e) => e.status === 'completed').length || 0,
                editsFailed: state.edits?.filter((e) => e.status === 'failed').length || 0,
                reportHasMetrics: responseMessages.length > 0,
              });
            } catch (error) {
              console.error('[modify-reports] Error updating final entries:', error);
              // Don't throw - return the result anyway
            }
          }
        }

        const executionTime = Date.now() - startTime;
        console.info('[modify-reports] Execution completed', {
          executionTime: `${executionTime}ms`,
          success: result?.success,
        });

        return result as ModifyReportsOutput;
      } catch (error) {
        const executionTime = Date.now() - startTime;
        console.error('[modify-reports] Execution failed', {
          error,
          executionTime: `${executionTime}ms`,
        });

        // Update last entries with failure status if possible
        if (context.messageId) {
          try {
            const toolCallId = state.toolCallId || `tool-${Date.now()}`;

            // Update state edits to failed status
            if (state.edits) {
              state.edits.forEach((edit) => {
                if (edit.status === 'loading') {
                  edit.status = 'failed';
                }
              });
            }

            const reasoningEntry = createModifyReportsReasoningEntry(state, toolCallId);
            const rawLlmMessage = createModifyReportsRawLlmMessageEntry(state, toolCallId);
            const rawLlmResultEntry = createRawToolResultEntry(
              toolCallId,
              MODIFY_REPORTS_TOOL_NAME,
              {
                edits: state.edits,
              }
            );

            const updates: Parameters<typeof updateMessageEntries>[0] = {
              messageId: context.messageId,
            };

            if (reasoningEntry) {
              updates.reasoningMessages = [reasoningEntry];
            }

            if (rawLlmMessage) {
              updates.rawLlmMessages = [rawLlmMessage, rawLlmResultEntry];
            }

            if (reasoningEntry || rawLlmMessage) {
              await updateMessageEntries(updates);
            }
          } catch (updateError) {
            console.error('[modify-reports] Error updating entries on failure:', updateError);
          }
        }

        throw error;
      }
    },
    { name: 'modify-reports-execute' }
  );
}
