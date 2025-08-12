import { appendReportContent, replaceReportContent, updateMessageEntries } from '@buster/database';
import { wrapTraced } from 'braintrust';
import { trackFileAssociations } from '../../file-tracking-helper';
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

// Process a single edit operation
async function processEditOperation(
  reportId: string,
  edit: { code_to_replace: string; code: string },
  _currentContent: string
): Promise<{
  success: boolean;
  content?: string;
  error?: string;
}> {
  try {
    if (edit.code_to_replace === '') {
      // Append mode
      const result = await appendReportContent({
        reportId,
        content: edit.code,
      });
      return {
        success: true,
        content: result.content,
      };
    }
    // Replace mode
    const result = await replaceReportContent({
      reportId,
      findString: edit.code_to_replace,
      replaceString: edit.code,
    });
    return {
      success: true,
      content: result.content,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Edit operation failed',
    };
  }
}

// Process all edit operations sequentially
async function processEditOperations(
  reportId: string,
  edits: Array<{ code_to_replace: string; code: string }>,
  state?: ModifyReportsState
): Promise<{
  success: boolean;
  finalContent?: string;
  errors: string[];
  version?: number;
}> {
  let currentContent = '';
  const errors: string[] = [];
  let allSuccess = true;
  let currentVersion = 1;

  for (let index = 0; index < edits.length; index++) {
    const edit = edits[index];
    // Update state edit status to processing
    if (state?.edits?.[index]) {
      state.edits[index].status = 'loading';
    }

    const result = await processEditOperation(reportId, edit, currentContent);

    if (result.success && result.content) {
      currentContent = result.content;
      currentVersion++;

      // Update state edit status to completed
      if (state?.edits?.[index]) {
        state.edits[index].status = 'completed';
      }

      // Update state current content
      if (state) {
        state.currentContent = currentContent;
        state.version_number = currentVersion;
      }
    } else {
      allSuccess = false;
      const operation = edit.code_to_replace === '' ? 'append' : 'replace';
      const errorMsg = `Edit ${index + 1} (${operation}): ${result.error || 'Unknown error'}`;
      errors.push(errorMsg);

      // Update state edit status to failed
      if (state?.edits?.[index]) {
        state.edits[index].status = 'failed';
        state.edits[index].error = result.error || 'Unknown error';
      }
      // Continue processing remaining edits even if one fails
    }
  }

  const returnValue: {
    success: boolean;
    finalContent?: string;
    errors: string[];
    version?: number;
  } = {
    success: allSuccess,
    errors,
    version: currentVersion,
  };

  if (currentContent !== '') {
    returnValue.finalContent = currentContent;
    if (state) {
      state.finalContent = currentContent;
    }
  }

  return returnValue;
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
    const editResult = await processEditOperations(params.id, params.edits, state);

    // Track file associations if messageId is available
    if (messageId && editResult.success && editResult.finalContent) {
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

              const reasoningEntry = createModifyReportsReasoningEntry(state, toolCallId);
              const rawLlmMessage = createModifyReportsRawLlmMessageEntry(state, toolCallId);

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

              console.info('[modify-reports] Updated last entries with final results', {
                messageId: context.messageId,
                success: typedResult.success,
                editsApplied: state.edits?.filter((e) => e.status === 'completed').length || 0,
                editsFailed: state.edits?.filter((e) => e.status === 'failed').length || 0,
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
