import { updateMessageEntries } from '@buster/database';
import { wrapTraced } from 'braintrust';
import { createRawToolResultEntry } from '../../../shared/create-raw-llm-tool-result-entry';
import { trackFileAssociations } from '../../file-tracking-helper';
import type {
  CreateReportsContext,
  CreateReportsInput,
  CreateReportsOutput,
  CreateReportsState,
} from './create-reports-tool';
import { CREATE_REPORTS_TOOL_NAME } from './create-reports-tool';
import {
  createCreateReportsRawLlmMessageEntry,
  createCreateReportsReasoningEntry,
} from './helpers/create-reports-tool-transform-helper';

// Main create report files function - now just handles finalization
const finalizeReportFiles = wrapTraced(
  async (
    params: CreateReportsInput,
    context: CreateReportsContext,
    state?: CreateReportsState
  ): Promise<CreateReportsOutput> => {
    // Get context values
    const userId = context.userId;
    const organizationId = context.organizationId;
    const messageId = context.messageId;

    if (!userId) {
      return {
        message: 'Unable to verify your identity. Please log in again.',
        files: [],
        failed_files: [],
      };
    }
    if (!organizationId) {
      return {
        message: 'Unable to access your organization. Please check your permissions.',
        files: [],
        failed_files: [],
      };
    }

    // Reports have already been created in the delta function
    // Here we just need to finalize and return the results
    const files = state?.files || [];
    const successfulFiles = files.filter((f) => f.id && f.file_name);
    const failedFiles: Array<{ name: string; error: string }> = [];

    // Check for any files that weren't successfully created
    params.files.forEach((inputFile, index) => {
      const stateFile = state?.files?.[index];
      if (!stateFile || !stateFile.id) {
        failedFiles.push({
          name: inputFile.name,
          error: 'Failed to create report',
        });
      }
    });

    // Track file associations if messageId is available
    if (messageId && successfulFiles.length > 0) {
      await trackFileAssociations({
        messageId,
        files: successfulFiles.map((file) => ({
          id: file.id,
          version: file.version_number,
        })),
      });
    }

    // Generate result message
    let message: string;
    if (failedFiles.length === 0) {
      message = `Successfully created ${successfulFiles.length} report files.`;
    } else if (successfulFiles.length === 0) {
      message = `Failed to create all report files.`;
    } else {
      message = `Successfully created ${successfulFiles.length} report files. Failed to create ${failedFiles.length} files.`;
    }

    return {
      message,
      files: successfulFiles.map((f) => ({
        id: f.id,
        name: f.file_name || '',
        version_number: f.version_number,
      })),
      failed_files: failedFiles,
    };
  },
  { name: 'Finalize Report Files' }
);

export function createCreateReportsExecute(
  context: CreateReportsContext,
  state: CreateReportsState
) {
  return wrapTraced(
    async (input: CreateReportsInput): Promise<CreateReportsOutput> => {
      const startTime = Date.now();

      try {
        // Call the finalization function
        const result = await finalizeReportFiles(input, context, state);

        // Update state files with final results
        if (result && typeof result === 'object') {
          const typedResult = result as CreateReportsOutput;
          // Ensure state.files is initialized for safe mutations below
          state.files = state.files ?? [];

          // Update successful files
          if (typedResult.files && Array.isArray(typedResult.files)) {
            typedResult.files.forEach((file) => {
              const stateFile = (state.files ?? []).find((f) => f.file_name === file.name);
              if (stateFile) {
                stateFile.status = 'completed';
              }
            });
          }

          // Update failed files
          if (typedResult.failed_files && Array.isArray(typedResult.failed_files)) {
            typedResult.failed_files.forEach((failedFile) => {
              const stateFile = (state.files ?? []).find((f) => f.file_name === failedFile.name);
              if (stateFile) {
                stateFile.status = 'failed';
              }
            });
          }

          // Update last entries if we have a messageId
          if (context.messageId) {
            try {
              const finalStatus = typedResult.failed_files?.length ? 'failed' : 'completed';
              const toolCallId = state.toolCallId || `tool-${Date.now()}`;

              // Update state for final status
              if (state.files) {
                state.files.forEach((f) => {
                  if (!f.status || f.status === 'loading') {
                    f.status = finalStatus === 'failed' ? 'failed' : 'completed';
                  }
                });
              }

              const reasoningEntry = createCreateReportsReasoningEntry(state, toolCallId);
              const rawLlmMessage = createCreateReportsRawLlmMessageEntry(state, toolCallId);
              const rawLlmResultEntry = createRawToolResultEntry(
                toolCallId,
                CREATE_REPORTS_TOOL_NAME,
                {
                  files: state.files,
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

              console.info('[create-reports] Updated last entries with final results', {
                messageId: context.messageId,
                successCount: typedResult.files?.length || 0,
                failedCount: typedResult.failed_files?.length || 0,
              });
            } catch (error) {
              console.error('[create-reports] Error updating final entries:', error);
              // Don't throw - return the result anyway
            }
          }
        }

        const executionTime = Date.now() - startTime;
        console.info('[create-reports] Execution completed', {
          executionTime: `${executionTime}ms`,
          filesCreated: result?.files?.length || 0,
          filesFailed: result?.failed_files?.length || 0,
        });

        return result as CreateReportsOutput;
      } catch (error) {
        const executionTime = Date.now() - startTime;
        console.error('[create-reports] Execution failed', {
          error,
          executionTime: `${executionTime}ms`,
        });

        // Update last entries with failure status if possible
        if (context.messageId) {
          try {
            const toolCallId = state.toolCallId || `tool-${Date.now()}`;
            // Update state files to failed status
            if (state.files) {
              state.files.forEach((f) => {
                f.status = 'failed';
              });
            }

            const reasoningEntry = createCreateReportsReasoningEntry(state, toolCallId);
            const rawLlmMessage = createCreateReportsRawLlmMessageEntry(state, toolCallId);
            const rawLlmResultEntry = createRawToolResultEntry(
              toolCallId,
              CREATE_REPORTS_TOOL_NAME,
              {
                files: state.files,
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
            console.error('[create-reports] Error updating entries on failure:', updateError);
          }
        }

        throw error;
      }
    },
    { name: 'create-reports-execute' }
  );
}
