import { randomUUID } from 'node:crypto';
import { db, updateMessageEntries } from '@buster/database';
import { dashboardFiles, metricFiles, metricFilesToDashboardFiles } from '@buster/database';
import type { ModelMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import * as yaml from 'yaml';
import { z } from 'zod';
import { trackFileAssociations } from '../../file-tracking-helper';
import { addDashboardVersionToHistory, getLatestVersionNumber } from '../version-history-helpers';
import type { DashboardYml, VersionHistory } from '../version-history-types';
import {
  createDashboardsRawLlmMessageEntry,
  createDashboardsReasoningMessage,
  createDashboardsResponseMessage,
} from './helpers/modify-dashboards-transform-helper';
import type {
  ModifyDashboardsContext,
  ModifyDashboardsInput,
  ModifyDashboardsOutput,
  ModifyDashboardsState,
} from './modify-dashboards-tool';

// Core interfaces matching Rust structs exactly
interface DashboardFileUpdateParams {
  id: string;
  yml_content: string;
}

interface ModifyDashboardFilesParams {
  files: DashboardFileUpdateParams[];
}

interface FailedFileModification {
  id: string;
  error: string;
}

interface DashboardFileContent {
  rows: Array<{
    items: Array<{
      id: string;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

interface FileWithId {
  id: string;
  name: string;
  file_type: string;
  result_message?: string;
  results?: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
  version_number: number;
  content?: DashboardFileContent;
}

interface ModifyDashboardFilesOutput {
  message: string;
  duration: number;
  files: FileWithId[];
  failed_files: FailedFileModification[];
}

// Row item schema matching Rust RowItem
const rowItemSchema = z.object({
  id: z.string().uuid('Must be a valid UUID for an existing metric'),
});

// Row schema matching Rust Row struct exactly
const rowSchema = z.object({
  id: z.number().int().positive('Row ID must be a positive integer'),
  items: z
    .array(rowItemSchema)
    .min(1, 'Each row must have at least 1 item')
    .max(4, 'Each row can have at most 4 items'),
  column_sizes: z
    .array(
      z
        .number()
        .int()
        .min(3, 'Each column size must be at least 3')
        .max(12, 'Each column size cannot exceed 12')
    )
    .min(1, 'column_sizes array cannot be empty')
    .refine((sizes) => sizes.reduce((sum, size) => sum + size, 0) === 12, {
      message: 'Column sizes must sum to exactly 12',
    }),
  rowHeight: z
    .number()
    .int()
    .min(320, 'Row height must be at least 320')
    .max(550, 'Row height cannot exceed 550')
    .optional(),
});

// Dashboard YAML schema matching Rust DashboardYml struct exactly
const dashboardYmlSchema = z
  .object({
    name: z.string().min(1, 'Dashboard name is required'),
    description: z.string().optional(),
    rows: z
      .array(rowSchema)
      .min(1, 'Dashboard must have at least one row')
      .refine(
        (rows) => {
          const ids = rows.map((row) => row.id);
          const uniqueIds = new Set(ids);
          return ids.length === uniqueIds.size;
        },
        {
          message: 'All row IDs must be unique',
        }
      ),
  })
  .refine(
    (dashboard) => {
      // Validate each row structure and column constraints
      return dashboard.rows.every((row) => {
        // Check that number of items matches number of column sizes
        if (row.items.length !== row.column_sizes.length) {
          return false;
        }

        // Check column size constraints
        const sum = row.column_sizes.reduce((acc, size) => acc + size, 0);
        if (sum !== 12) {
          return false;
        }

        // Check minimum column size
        return row.column_sizes.every((size) => size >= 3);
      });
    },
    {
      message:
        'Invalid row configuration: items must match column_sizes, sizes must sum to 12, and each size must be >= 3',
    }
  );

// Parse and validate dashboard YAML content
function parseAndValidateYaml(ymlContent: string): {
  success: boolean;
  error?: string;
  data?: DashboardYml;
} {
  try {
    const parsedYml = yaml.parse(ymlContent);
    const validationResult = dashboardYmlSchema.safeParse(parsedYml);

    if (!validationResult.success) {
      return {
        success: false,
        error: `Invalid YAML structure: ${validationResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
      };
    }

    // Transform the validated data to match DashboardYml type (camelCase)
    const transformedData: DashboardYml = {
      name: validationResult.data.name,
      description: validationResult.data.description,
      rows: validationResult.data.rows.map((row) => ({
        id: row.id,
        items: row.items,
        columnSizes: row.column_sizes, // Transform snake_case to camelCase
        rowHeight: row.rowHeight,
      })),
    };

    return { success: true, data: transformedData };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'YAML parsing failed',
    };
  }
}

// Validate that all referenced metric IDs exist in the database
async function validateMetricIds(
  metricIds: string[]
): Promise<{ success: boolean; missingIds?: string[]; error?: string }> {
  if (metricIds.length === 0) {
    return { success: true };
  }

  try {
    const existingMetrics = await db
      .select({ id: metricFiles.id })
      .from(metricFiles)
      .where(inArray(metricFiles.id, metricIds))
      .execute();

    const existingIds = existingMetrics.map((m) => m.id);
    const missingIds = metricIds.filter((id) => !existingIds.includes(id));

    if (missingIds.length > 0) {
      return { success: false, missingIds };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate metric IDs',
    };
  }
}

// Process a dashboard file modification request
async function processDashboardFile(file: DashboardFileUpdateParams): Promise<{
  success: boolean;
  dashboardFile?: FileWithId;
  dashboardYml?: DashboardYml;
  existingFile?: typeof dashboardFiles.$inferSelect;
  error?: string;
}> {
  // Get the dashboard file from database
  const dashboardFileRecord = await db
    .select()
    .from(dashboardFiles)
    .where(eq(dashboardFiles.id, file.id))
    .execute();

  if (dashboardFileRecord.length === 0) {
    return {
      success: false,
      error:
        'The dashboard you are trying to modify does not exist. Please check the dashboard ID.',
    };
  }

  const existingFile = dashboardFileRecord[0];
  if (!existingFile) {
    return {
      success: false,
      error: 'Unable to retrieve the dashboard file. Please try again.',
    };
  }

  // Parse and validate YAML
  const yamlValidation = parseAndValidateYaml(file.yml_content);
  if (!yamlValidation.success) {
    return {
      success: false,
      error:
        'The dashboard configuration format is incorrect. Please check the YAML syntax and structure.',
    };
  }

  const dashboardYml = yamlValidation.data;
  if (!dashboardYml) {
    return {
      success: false,
      error: 'Failed to parse dashboard YAML data.',
    };
  }

  // Collect all metric IDs from rows
  const metricIds: string[] = dashboardYml.rows.flatMap((row) => row.items).map((item) => item.id);

  // Validate metric IDs if any exist
  if (metricIds.length > 0) {
    const metricValidation = await validateMetricIds(metricIds);
    if (!metricValidation.success) {
      if (metricValidation.missingIds) {
        return {
          success: false,
          error:
            'Some metrics referenced in the dashboard do not exist. Please create the metrics first before adding them to a dashboard.',
        };
      }
      return {
        success: false,
        error: 'Unable to verify the metrics. Please try again or contact support.',
      };
    }
  }

  // Get the latest version number
  const currentVersionHistory = existingFile.versionHistory as VersionHistory | null;
  const latestVersion = getLatestVersionNumber(currentVersionHistory) + 1;

  const dashboardFile: FileWithId = {
    id: file.id,
    name: dashboardYml.name,
    file_type: 'dashboard',
    created_at: existingFile.createdAt,
    updated_at: new Date().toISOString(),
    version_number: latestVersion,
    content: dashboardYml as DashboardFileContent,
  };

  return {
    success: true,
    dashboardFile,
    dashboardYml,
    existingFile,
  };
}

function generateResultMessage(
  modifiedFiles: FileWithId[],
  failedFiles: FailedFileModification[]
): string {
  if (failedFiles.length === 0) {
    return `Successfully modified ${modifiedFiles.length} dashboard ${modifiedFiles.length === 1 ? 'file' : 'files'}.`;
  }

  const successMsg =
    modifiedFiles.length > 0
      ? `Successfully modified ${modifiedFiles.length} dashboard ${modifiedFiles.length === 1 ? 'file' : 'files'}. `
      : '';

  const failures = failedFiles.map(
    (failure) =>
      `Failed to modify dashboard '${failure.id}': ${failure.error}.\n\nPlease check the dashboard configuration and try again. This error could be due to:\n- Invalid metric UUIDs (please check that the metrics exist)\n- Invalid configuration in the dashboard file\n- Row configuration errors (column sizes must sum to 12)\n- The dashboard file does not exist`
  );

  if (failures.length === 1) {
    return `${successMsg.trim()}${failures[0]}.`;
  }

  return `${successMsg}Failed to modify ${failures.length} dashboard files:\n${failures.join('\n')}`;
}

// Main modify dashboard files function
const modifyDashboardFiles = wrapTraced(
  async (
    params: ModifyDashboardFilesParams,
    context: ModifyDashboardsContext
  ): Promise<ModifyDashboardFilesOutput> => {
    const startTime = Date.now();

    // Get context values
    const userId = context.userId;
    const organizationId = context.organizationId;
    const messageId = context.messageId;

    if (!userId) {
      return {
        message: 'Unable to verify your identity. Please log in again.',
        duration: Date.now() - startTime,
        files: [],
        failed_files: [],
      };
    }
    if (!organizationId) {
      return {
        message: 'Unable to access your organization. Please check your permissions.',
        duration: Date.now() - startTime,
        files: [],
        failed_files: [],
      };
    }

    const files: FileWithId[] = [];
    const failedFiles: FailedFileModification[] = [];

    // Process files concurrently
    const processResults = await Promise.allSettled(
      params.files.map(async (file) => {
        const result = await processDashboardFile(file);
        return { fileId: file.id, result };
      })
    );

    const successfulProcessing: Array<{
      dashboardFile: FileWithId;
      dashboardYml: DashboardYml;
      existingFile: typeof dashboardFiles.$inferSelect;
    }> = [];

    // Separate successful from failed processing
    for (const processResult of processResults) {
      if (processResult.status === 'fulfilled') {
        const { fileId, result } = processResult.value;
        if (result.success && result.dashboardFile && result.dashboardYml && result.existingFile) {
          successfulProcessing.push({
            dashboardFile: result.dashboardFile,
            dashboardYml: result.dashboardYml,
            existingFile: result.existingFile,
          });
        } else {
          failedFiles.push({
            id: fileId,
            error: result.error || 'Unknown error',
          });
        }
      } else {
        failedFiles.push({
          id: 'unknown',
          error: processResult.reason?.message || 'Processing failed',
        });
      }
    }

    // Database operations
    if (successfulProcessing.length > 0) {
      try {
        await db.transaction(async (tx: typeof db) => {
          // Update dashboard files
          for (const sp of successfulProcessing) {
            // Add new version to history
            const updatedVersionHistory = addDashboardVersionToHistory(
              sp.existingFile.versionHistory as VersionHistory | null,
              sp.dashboardYml,
              new Date().toISOString()
            );

            await tx
              .update(dashboardFiles)
              .set({
                content: sp.dashboardYml as DashboardFileContent,
                updatedAt: sp.dashboardFile.updated_at,
                versionHistory: updatedVersionHistory,
                name: sp.dashboardYml.name,
              })
              .where(eq(dashboardFiles.id, sp.dashboardFile.id))
              .execute();

            // Update metric associations
            const newMetricIds = sp.dashboardYml.rows
              .flatMap((row) => row.items)
              .map((item) => item.id);

            const existingAssociations = await tx
              .select({ metricFileId: metricFilesToDashboardFiles.metricFileId })
              .from(metricFilesToDashboardFiles)
              .where(
                and(
                  eq(metricFilesToDashboardFiles.dashboardFileId, sp.dashboardFile.id),
                  isNull(metricFilesToDashboardFiles.deletedAt)
                )
              )
              .execute();

            const existingMetricIds = existingAssociations.map((a) => a.metricFileId);

            // Add new associations
            const addedMetricIds = newMetricIds.filter(
              (id: string) => !existingMetricIds.includes(id)
            );
            for (const metricId of addedMetricIds) {
              await tx
                .insert(metricFilesToDashboardFiles)
                .values({
                  metricFileId: metricId,
                  dashboardFileId: sp.dashboardFile.id,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  deletedAt: null,
                  createdBy: userId,
                })
                .onConflictDoUpdate({
                  target: [
                    metricFilesToDashboardFiles.metricFileId,
                    metricFilesToDashboardFiles.dashboardFileId,
                  ],
                  set: {
                    deletedAt: null,
                    updatedAt: new Date().toISOString(),
                  },
                })
                .execute();
            }

            // Remove old associations
            const removedMetricIds = existingMetricIds.filter(
              (id: string) => !newMetricIds.includes(id)
            );
            if (removedMetricIds.length > 0) {
              await tx
                .update(metricFilesToDashboardFiles)
                .set({
                  deletedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                })
                .where(
                  and(
                    eq(metricFilesToDashboardFiles.dashboardFileId, sp.dashboardFile.id),
                    inArray(metricFilesToDashboardFiles.metricFileId, removedMetricIds),
                    isNull(metricFilesToDashboardFiles.deletedAt)
                  )
                )
                .execute();
            }
          }
        });

        // Add successful files to output
        for (const sp of successfulProcessing) {
          files.push({
            id: sp.dashboardFile.id,
            name: sp.dashboardFile.name,
            file_type: sp.dashboardFile.file_type,
            result_message: sp.dashboardFile.result_message || '',
            results: sp.dashboardFile.results || [],
            created_at: sp.dashboardFile.created_at,
            updated_at: sp.dashboardFile.updated_at,
            version_number: sp.dashboardFile.version_number,
          });
        }
      } catch (error) {
        // Add all successful processing to failed if database operation fails
        for (const sp of successfulProcessing) {
          failedFiles.push({
            id: sp.dashboardFile.id,
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

    const duration = Date.now() - startTime;
    const message = generateResultMessage(files, failedFiles);

    return {
      message,
      duration,
      files,
      failed_files: failedFiles,
    };
  },
  { name: 'Modify Dashboard Files' }
);

export function createModifyDashboardsExecute(
  context: ModifyDashboardsContext,
  state: ModifyDashboardsState
) {
  return wrapTraced(
    async (input: ModifyDashboardsInput): Promise<ModifyDashboardsOutput> => {
      const startTime = Date.now();

      try {
        // Call the main function directly instead of delegating
        const result = await modifyDashboardFiles(input as ModifyDashboardFilesParams, context);

        // Update state files with final results (IDs, versions, status)
        if (result && typeof result === 'object') {
          const typedResult = result as ModifyDashboardsOutput;
          // Ensure state.files is initialized for safe mutations below
          state.files = state.files ?? [];

          // Update successful files
          if (typedResult.files && Array.isArray(typedResult.files)) {
            typedResult.files.forEach((file) => {
              const stateFile = (state.files ?? []).find((f) => f.id === file.id);
              if (stateFile) {
                stateFile.name = file.name;
                stateFile.version = file.version_number;
                stateFile.status = 'completed';
              }
            });
          }

          // Update failed files
          if (typedResult.failed_files && Array.isArray(typedResult.failed_files)) {
            typedResult.failed_files.forEach((failedFile) => {
              const stateFile = (state.files ?? []).find((f) => f.id === failedFile.id);
              if (stateFile) {
                stateFile.status = 'failed';
                stateFile.error = failedFile.error;
              }
            });
          }

          // Update last entries if we have a messageId (no need for explicit entry IDs)
          if (context.messageId) {
            try {
              const finalStatus = typedResult.failed_files?.length ? 'failed' : 'completed';
              const toolCallId = state.toolCallId || `tool-${Date.now()}`;

              const reasoningEntry = createDashboardsReasoningMessage(
                toolCallId,
                state.files ?? [],
                finalStatus
              );
              const responseEntry = createDashboardsResponseMessage(
                toolCallId,
                typedResult.message
              );
              const rawLlmMessage: ModelMessage = {
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolCallId,
                    toolName: 'modify-dashboards',
                    input: state.parsedArgs || (input as Partial<ModifyDashboardFilesParams>),
                  },
                ],
              };

              await updateMessageEntries({
                messageId: context.messageId,
                reasoningEntry,
                responseEntry,
                rawLlmMessage,
                mode: 'update',
              });

              console.info('[modify-dashboards] Updated last entries with final results', {
                messageId: context.messageId,
                successCount: typedResult.files?.length || 0,
                failedCount: typedResult.failed_files?.length || 0,
              });
            } catch (error) {
              console.error('[modify-dashboards] Error updating final entries:', error);
              // Don't throw - return the result anyway
            }
          }
        }

        const executionTime = Date.now() - startTime;
        console.info('[modify-dashboards] Execution completed', {
          executionTime: `${executionTime}ms`,
          filesModified: result?.files?.length || 0,
          filesFailed: result?.failed_files?.length || 0,
        });

        return result as ModifyDashboardsOutput;
      } catch (error) {
        const executionTime = Date.now() - startTime;
        console.error('[modify-dashboards] Execution failed', {
          error,
          executionTime: `${executionTime}ms`,
        });

        // Update last entries with failure status if possible
        if (context.messageId) {
          try {
            const toolCallId = state.toolCallId || `tool-${Date.now()}`;
            const reasoningEntry = createDashboardsReasoningMessage(
              toolCallId,
              (state.files ?? []).map((f) => ({ ...f, status: 'failed' })),
              'failed'
            );
            const rawLlmMessage: ModelMessage = {
              role: 'assistant',
              content: [
                {
                  type: 'tool-call',
                  toolCallId,
                  toolName: 'modify-dashboards',
                  input: state.parsedArgs || {},
                },
              ],
            };

            await updateMessageEntries({
              messageId: context.messageId,
              reasoningEntry,
              rawLlmMessage,
              mode: 'update',
            });
          } catch (updateError) {
            console.error('[modify-dashboards] Error updating entries on failure:', updateError);
          }
        }

        throw error;
      }
    },
    { name: 'modify-dashboards-execute' }
  );
}
