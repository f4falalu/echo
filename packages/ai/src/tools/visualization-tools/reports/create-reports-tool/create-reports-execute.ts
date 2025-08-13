import { randomUUID } from 'node:crypto';
import { db, updateMessageEntries } from '@buster/database';
import { assetPermissions, reportFiles } from '@buster/database';
import { wrapTraced } from 'braintrust';
import { trackFileAssociations } from '../../file-tracking-helper';
import type {
  CreateReportsContext,
  CreateReportsInput,
  CreateReportsOutput,
  CreateReportsState,
} from './create-reports-tool';
import {
  createCreateReportsRawLlmMessageEntry,
  createCreateReportsReasoningEntry,
} from './helpers/create-reports-tool-transform-helper';

// Type definitions
interface FileWithId {
  id: string;
  name: string;
  file_type: string;
  result_message?: string;
  results?: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
  version_number: number;
  content?: string;
}

interface FailedFileCreation {
  name: string;
  error: string;
}

type VersionHistory = (typeof reportFiles.$inferSelect)['versionHistory'];

// Helper function to create initial version history
function createInitialReportVersionHistory(content: string, createdAt: string): VersionHistory {
  return {
    '1': {
      content,
      updated_at: createdAt,
      version_number: 1,
    },
  };
}

// Validate markdown content
function validateMarkdownContent(content: string): {
  success: boolean;
  error?: string;
} {
  try {
    // Basic validation - ensure content is not empty and is a string
    if (!content || typeof content !== 'string') {
      return {
        success: false,
        error: 'Report content must be a non-empty string',
      };
    }

    // Check for reasonable length (not too short or too long)
    if (content.trim().length < 10) {
      return {
        success: false,
        error: 'Report content is too short. Please provide more detailed content.',
      };
    }

    if (content.length > 100000) {
      return {
        success: false,
        error: 'Report content is too long. Please keep reports under 100,000 characters.',
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Content validation failed',
    };
  }
}

// Process a report file creation request
async function processReportFile(
  file: { name: string; content: string },
  reportId?: string
): Promise<{
  success: boolean;
  reportFile?: FileWithId;
  error?: string;
}> {
  // Validate markdown content
  const contentValidation = validateMarkdownContent(file.content);
  if (!contentValidation.success) {
    return {
      success: false,
      error: contentValidation.error || 'Invalid report content',
    };
  }

  // Use provided report ID from state or generate new one
  const id = reportId || randomUUID();

  const reportFile: FileWithId = {
    id,
    name: file.name,
    file_type: 'report',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version_number: 1,
    content: file.content,
  };

  return {
    success: true,
    reportFile,
  };
}

function generateResultMessage(
  createdFiles: FileWithId[],
  failedFiles: FailedFileCreation[]
): string {
  if (failedFiles.length === 0) {
    return `Successfully created ${createdFiles.length} report files.`;
  }

  const successMsg =
    createdFiles.length > 0 ? `Successfully created ${createdFiles.length} report files. ` : '';

  const failures = failedFiles.map(
    (failure) =>
      `Failed to create '${failure.name}': ${failure.error}.\n\nPlease recreate the report from scratch rather than attempting to modify. This error could be due to:\n- Invalid or empty content\n- Content too long (over 100,000 characters)\n- Special characters causing parsing issues\n- Network or database connectivity problems`
  );

  if (failures.length === 1) {
    return `${successMsg.trim()}${failures[0]}.`;
  }

  return `${successMsg}Failed to create ${failures.length} report files:\n${failures.join('\n')}`;
}

// Main create report files function
const createReportFiles = wrapTraced(
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

    const files: FileWithId[] = [];
    const failedFiles: FailedFileCreation[] = [];

    // Process files concurrently, passing report IDs from state
    const processResults = await Promise.allSettled(
      params.files.map(async (file, index) => {
        // Ensure file has required properties
        if (!file.name || !file.content) {
          return {
            fileName: file.name || 'unknown',
            result: {
              success: false,
              error: 'Missing required file properties',
            },
          };
        }
        // Get report ID from state if available
        const reportId = state?.files?.[index]?.id;
        const result = await processReportFile(
          file as { name: string; content: string },
          typeof reportId === 'string' ? reportId : undefined
        );
        return { fileName: file.name, result };
      })
    );

    const successfulProcessing: Array<{
      reportFile: FileWithId;
    }> = [];

    // Separate successful from failed processing
    for (const processResult of processResults) {
      if (processResult.status === 'fulfilled') {
        const { fileName, result } = processResult.value;
        if (result.success && result.reportFile) {
          successfulProcessing.push({
            reportFile: result.reportFile,
          });
        } else {
          failedFiles.push({
            name: fileName,
            error: result.error || 'Unknown error',
          });
        }
      } else {
        failedFiles.push({
          name: 'unknown',
          error: processResult.reason?.message || 'Processing failed',
        });
      }
    }

    // Database operations
    if (successfulProcessing.length > 0) {
      try {
        await db.transaction(async (tx: typeof db) => {
          // Insert report files
          const reportRecords = successfulProcessing.map((sp, index) => {
            const originalFile = params.files[index];
            if (!originalFile) {
              // This should never happen, but handle gracefully
              return {
                id: sp.reportFile.id,
                name: sp.reportFile.name,
                content: sp.reportFile.content || '',
                organizationId,
                createdBy: userId,
                createdAt: sp.reportFile.created_at,
                updatedAt: sp.reportFile.updated_at,
                deletedAt: null,
                publiclyAccessible: false,
                publiclyEnabledBy: null,
                publicExpiryDate: null,
                versionHistory: createInitialReportVersionHistory(
                  sp.reportFile.content || '',
                  sp.reportFile.created_at
                ),
                publicPassword: null,
                workspaceSharing: 'none' as const,
                workspaceSharingEnabledBy: null,
                workspaceSharingEnabledAt: null,
              };
            }
            return {
              id: sp.reportFile.id,
              name: originalFile.name,
              content: sp.reportFile.content || '',
              organizationId,
              createdBy: userId,
              createdAt: sp.reportFile.created_at,
              updatedAt: sp.reportFile.updated_at,
              deletedAt: null,
              publiclyAccessible: false,
              publiclyEnabledBy: null,
              publicExpiryDate: null,
              versionHistory: createInitialReportVersionHistory(
                sp.reportFile.content || '',
                sp.reportFile.created_at
              ),
              publicPassword: null,
              workspaceSharing: 'none' as const,
              workspaceSharingEnabledBy: null,
              workspaceSharingEnabledAt: null,
            };
          });
          await tx.insert(reportFiles).values(reportRecords);

          // Insert asset permissions
          const assetPermissionRecords = reportRecords.map((record) => ({
            identityId: userId,
            identityType: 'user' as const,
            assetId: record.id,
            assetType: 'report_file' as const,
            role: 'owner' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
            createdBy: userId,
            updatedBy: userId,
          }));
          await tx.insert(assetPermissions).values(assetPermissionRecords);
        });

        // Add successful files to output
        for (const sp of successfulProcessing) {
          files.push({
            id: sp.reportFile.id,
            name: sp.reportFile.name,
            file_type: sp.reportFile.file_type,
            result_message: sp.reportFile.result_message || '',
            results: sp.reportFile.results || [],
            created_at: sp.reportFile.created_at,
            updated_at: sp.reportFile.updated_at,
            version_number: sp.reportFile.version_number,
          });
        }
      } catch (error) {
        // Add all successful processing to failed if database operation fails
        for (const sp of successfulProcessing) {
          failedFiles.push({
            name: sp.reportFile.name,
            error: `Failed to save to database: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      }
    }

    // Track file associations if messageId is available
    if (messageId && files.length > 0) {
      await trackFileAssociations({
        messageId,
        files: files.map((file) => ({
          id: file.id,
          version: file.version_number,
        })),
      });
    }

    const message = generateResultMessage(files, failedFiles);

    return {
      message,
      files: files.map((f) => ({
        id: f.id,
        name: f.name,
        version_number: f.version_number,
      })),
      failed_files: failedFiles,
    };
  },
  { name: 'Create Report Files' }
);

export function createCreateReportsExecute(
  context: CreateReportsContext,
  state: CreateReportsState
) {
  return wrapTraced(
    async (input: CreateReportsInput): Promise<CreateReportsOutput> => {
      const startTime = Date.now();

      try {
        // Call the main function directly, passing state for report IDs
        const result = await createReportFiles(input, context, state);

        // Update state files with final results (IDs, versions, status)
        if (result && typeof result === 'object') {
          const typedResult = result as CreateReportsOutput;
          // Ensure state.files is initialized for safe mutations below
          state.files = state.files ?? [];

          // Update successful files
          if (typedResult.files && Array.isArray(typedResult.files)) {
            typedResult.files.forEach((file) => {
              const stateFile = (state.files ?? []).find((f) => f.file_name === file.name);
              if (stateFile) {
                stateFile.id = file.id;
                stateFile.version_number = file.version_number;
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

              const updates: Parameters<typeof updateMessageEntries>[0] = {
                messageId: context.messageId,
                toolCallId: state.toolCallId || '',
              };

              if (reasoningEntry) {
                updates.reasoningEntry = reasoningEntry;
              }

              if (rawLlmMessage) {
                updates.rawLlmMessage = rawLlmMessage;
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

            const updates: Parameters<typeof updateMessageEntries>[0] = {
              messageId: context.messageId,
              toolCallId: state.toolCallId || '',
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
            console.error('[create-reports] Error updating entries on failure:', updateError);
          }
        }

        throw error;
      }
    },
    { name: 'create-reports-execute' }
  );
}
