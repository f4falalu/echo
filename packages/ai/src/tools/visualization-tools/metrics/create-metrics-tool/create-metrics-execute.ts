import { randomUUID } from 'node:crypto';
import type { DataSource } from '@buster/data-source';
import { assetPermissions, db, metricFiles, updateMessageEntries } from '@buster/database';
import {
  type ChartConfigProps,
  ChartConfigPropsSchema,
  type ColumnMetaData,
  type DataMetadata,
} from '@buster/server-shared/metrics';
import { wrapTraced } from 'braintrust';
import * as yaml from 'yaml';
import { z } from 'zod';
import { getDataSource } from '../../../../utils/get-data-source';
import {
  createPermissionErrorMessage,
  validateSqlPermissions,
} from '../../../../utils/sql-permissions';
import { trackFileAssociations } from '../../file-tracking-helper';
import { validateAndAdjustBarLineAxes } from '../helpers/bar-line-axis-validator';
import { ensureTimeFrameQuoted } from '../helpers/time-frame-helper';
import type {
  CreateMetricsContext,
  CreateMetricsInput,
  CreateMetricsOutput,
  CreateMetricsState,
} from './create-metrics-tool';
import {
  createCreateMetricsRawLlmMessageEntry,
  createCreateMetricsReasoningEntry,
} from './helpers/create-metrics-transform-helper';

interface FileWithId {
  id: string;
  name: string;
  file_type: string;
  result_message?: string;
  results?: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
  version_number: number;
}

interface FailedFileCreation {
  name: string;
  error: string;
}

interface MetricFileResult {
  success: boolean;
  error?: string;
  metricFile?: FileWithId;
  metricYml?: ChartConfigProps;
  message?: string;
  results?: Record<string, unknown>[];
}

type VersionHistory = (typeof metricFiles.$inferSelect)['versionHistory'];

// Helper function to create initial version history
function createInitialMetricVersionHistory(
  metric: ChartConfigProps,
  createdAt: string
): VersionHistory {
  return {
    '1': {
      content: JSON.stringify(metric),
      updated_at: createdAt,
      version_number: 1,
    },
  };
}

interface ValidationResult {
  success: boolean;
  error?: string;
  message?: string;
  results?: Record<string, unknown>[];
  metadata?: QueryMetadata;
}

interface QueryMetadata {
  rowCount: number;
  totalRowCount: number;
  executionTime: number;
  limited: boolean;
  maxRows: number;
}

interface ResultMetadata {
  totalRowCount?: number | undefined;
  limited?: boolean | undefined;
  maxRows?: number | undefined;
}

const resultMetadataSchema = z.object({
  totalRowCount: z.number().optional(),
  limited: z.boolean().optional(),
  maxRows: z.number().optional(),
});

/**
 * Analyzes query results to create DataMetadata structure
 */
function createDataMetadata(results: Record<string, unknown>[]): DataMetadata {
  if (!results.length) {
    return {
      column_count: 0,
      row_count: 0,
      column_metadata: [],
    };
  }

  const columnNames = Object.keys(results[0] || {});
  const columnMetadata: ColumnMetaData[] = [];

  for (const columnName of columnNames) {
    const values = results
      .map((row) => row[columnName])
      .filter((v) => v !== null && v !== undefined);

    // Determine column type based on the first non-null value
    let columnType: ColumnMetaData['type'] = 'text';
    let simpleType: ColumnMetaData['simple_type'] = 'text';

    if (values.length > 0) {
      const firstValue = values[0];

      if (typeof firstValue === 'number') {
        columnType = Number.isInteger(firstValue) ? 'int4' : 'float8';
        simpleType = 'number';
      } else if (typeof firstValue === 'boolean') {
        columnType = 'bool';
        simpleType = 'text'; // boolean is not in the simple_type enum, so use text
      } else if (firstValue instanceof Date) {
        columnType = 'timestamp';
        simpleType = 'date';
      } else if (typeof firstValue === 'string') {
        // Check if it's a numeric string first
        if (!Number.isNaN(Number(firstValue))) {
          columnType = Number.isInteger(Number(firstValue)) ? 'int4' : 'float8';
          simpleType = 'number';
        } else if (
          !Number.isNaN(Date.parse(firstValue)) &&
          // Additional check to avoid parsing simple numbers as dates
          (firstValue.includes('-') || firstValue.includes('/') || firstValue.includes(':'))
        ) {
          columnType = 'date';
          simpleType = 'date';
        } else {
          columnType = 'text';
          simpleType = 'text';
        }
      }
    }

    // Calculate min, max, and unique values
    let minValue: string | number = '';
    let maxValue: string | number = '';
    const uniqueValues = new Set(values);

    if (simpleType === 'number' && values.length > 0) {
      const numericValues = values.filter((v): v is number => typeof v === 'number');
      if (numericValues.length > 0) {
        minValue = Math.min(...numericValues);
        maxValue = Math.max(...numericValues);
      }
    } else if (simpleType === 'date' && values.length > 0) {
      const dateValues = values
        .map((v) => {
          if (v instanceof Date) return v.getTime();
          if (typeof v === 'string') return Date.parse(v);
          return null;
        })
        .filter((v): v is number => v !== null && !Number.isNaN(v));

      if (dateValues.length > 0) {
        const minTime = Math.min(...dateValues);
        const maxTime = Math.max(...dateValues);
        minValue = new Date(minTime).toISOString();
        maxValue = new Date(maxTime).toISOString();
      }
    } else if (values.length > 0) {
      // For strings and other types, just take first and last in sorted order
      const sortedValues = [...values].sort();
      minValue = String(sortedValues[0]);
      maxValue = String(sortedValues[sortedValues.length - 1]);
    }

    columnMetadata.push({
      name: columnName,
      min_value: minValue,
      max_value: maxValue,
      unique_values: uniqueValues.size,
      simple_type: simpleType,
      type: columnType,
    });
  }

  return {
    column_count: columnNames.length,
    row_count: results.length,
    column_metadata: columnMetadata,
  };
}

async function processMetricFile(
  file: { name: string; yml_content: string },
  dataSourceId: string,
  dataSourceDialect: string,
  userId: string,
  metricId?: string
): Promise<MetricFileResult> {
  try {
    // Ensure timeFrame values are properly quoted before parsing
    const fixedYmlContent = ensureTimeFrameQuoted(file.yml_content);

    // Parse and validate YAML
    const metricYml = yaml.parse(fixedYmlContent);

    const validatedMetricYml = ChartConfigPropsSchema.parse(metricYml);

    // Validate and adjust bar/line chart axes
    let finalMetricYml: ChartConfigProps;
    try {
      finalMetricYml = validateAndAdjustBarLineAxes(validatedMetricYml);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid bar/line chart axis configuration',
      };
    }

    // Use provided metric ID from state or generate new one
    const id = metricId || randomUUID();

    // Validate SQL by running it
    const sqlValidationResult = await validateSql(
      metricYml.sql,
      dataSourceId,
      userId,
      dataSourceDialect
    );

    if (!sqlValidationResult.success) {
      return {
        success: false,
        error: `The SQL query has an issue: ${sqlValidationResult.error}. Please check your query syntax.`,
      };
    }

    // Create metric file object
    const now = new Date().toISOString();
    const metricFile: FileWithId = {
      id,
      name: metricYml.name,
      file_type: 'metric',
      result_message: sqlValidationResult.message || '',
      results: sqlValidationResult.results || [],
      created_at: now,
      updated_at: now,
      version_number: 1,
    };

    return {
      success: true,
      metricFile,
      metricYml: finalMetricYml,
      message: sqlValidationResult.message || '',
      results: sqlValidationResult.results || [],
    };
  } catch (error) {
    let errorMessage = 'Unknown error';

    if (error instanceof z.ZodError) {
      // Return the actual Zod validation errors for better debugging
      const issues = error.issues
        .map((issue) => {
          const path = issue.path.length > 0 ? ` at path '${issue.path.join('.')}'` : '';
          return `${issue.message}${path}`;
        })
        .join('; ');
      errorMessage = `The metric configuration is invalid: ${issues}`;
    } else if (error instanceof Error) {
      if (error.message.includes('YAMLParseError')) {
        errorMessage = 'The YAML format is incorrect. Please check the syntax and indentation.';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

async function validateSql(
  sqlQuery: string,
  dataSourceId: string,
  userId: string,
  dataSourceSyntax?: string
): Promise<ValidationResult> {
  try {
    if (!sqlQuery.trim()) {
      return { success: false, error: 'SQL query cannot be empty' };
    }

    // Basic SQL validation
    if (!sqlQuery.toLowerCase().includes('select')) {
      return { success: false, error: 'SQL query must contain SELECT statement' };
    }

    if (!sqlQuery.toLowerCase().includes('from')) {
      return { success: false, error: 'SQL query must contain FROM clause' };
    }

    // Validate permissions before attempting to get data source
    const permissionResult = await validateSqlPermissions(sqlQuery, userId, dataSourceSyntax);
    if (!permissionResult.isAuthorized) {
      return {
        success: false,
        error: createPermissionErrorMessage(permissionResult.unauthorizedTables),
      };
    }

    // Get a new DataSource instance
    let dataSource: DataSource | null = null;

    try {
      dataSource = await getDataSource(dataSourceId);
    } catch (_error) {
      return {
        success: false,
        error: `Unable to connect to your data source. Please check that it's properly configured and accessible.`,
      };
    }

    // Retry configuration for SQL validation
    const MAX_RETRIES = 3;
    const TIMEOUT_MS = 120000; // 120 seconds (2 minutes) per attempt for Snowflake queue handling
    const RETRY_DELAYS = [1000, 3000, 6000]; // 1s, 3s, 6s

    // Attempt execution with retries
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Execute the SQL query using the DataSource with row limit and timeout for validation
        // Use maxRows to limit results without modifying the SQL query (preserves Snowflake caching)
        const result = await dataSource.execute({
          sql: sqlQuery,
          options: {
            maxRows: 1000, // Additional safety limit at adapter level
            timeout: TIMEOUT_MS,
          },
        });

        if (result.success) {
          const allResults = result.rows || [];
          // Truncate results to 25 records for display in validation
          const results = allResults.slice(0, 25);

          // Validate metadata with Zod schema for runtime safety
          const validatedMetadata = resultMetadataSchema.safeParse(result.metadata);
          const parsedMetadata: ResultMetadata | undefined = validatedMetadata.success
            ? validatedMetadata.data
            : undefined;

          const metadata: QueryMetadata = {
            rowCount: results.length,
            totalRowCount: parsedMetadata?.totalRowCount ?? allResults.length,
            executionTime: result.executionTime || 100,
            limited: parsedMetadata?.limited ?? false,
            maxRows: parsedMetadata?.maxRows ?? 5000,
          };

          let message: string;
          if (allResults.length === 0) {
            message = 'Query executed successfully but returned no records';
          } else if (result.metadata?.limited) {
            message = `Query validated successfully. Results were limited to ${result.metadata.maxRows} rows for memory protection (query may return more rows when executed)${results.length < allResults.length ? ` - showing first 25 of ${allResults.length} fetched` : ''}`;
          } else {
            message = `Query validated successfully and returned ${allResults.length} records${allResults.length > 25 ? ' (showing sample of first 25)' : ''}`;
          }

          return {
            success: true,
            message,
            results,
            metadata,
          };
        }

        // Check if error is timeout-related
        const errorMessage = result.error?.message || 'Query execution failed';
        const isTimeout =
          errorMessage.toLowerCase().includes('timeout') ||
          errorMessage.toLowerCase().includes('timed out');

        if (isTimeout && attempt < MAX_RETRIES) {
          // Wait before retry
          const delay = RETRY_DELAYS[attempt] || 6000;
          console.warn(
            `[create-metrics] SQL validation timeout on attempt ${attempt + 1}/${MAX_RETRIES + 1}. Retrying in ${delay}ms...`,
            {
              sqlPreview: `${sqlQuery.substring(0, 100)}...`,
              attempt: attempt + 1,
              nextDelay: delay,
            }
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue; // Retry
        }

        // Not a timeout or no more retries
        return {
          success: false,
          error: errorMessage,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'SQL validation failed';
        const isTimeout =
          errorMessage.toLowerCase().includes('timeout') ||
          errorMessage.toLowerCase().includes('timed out');

        if (isTimeout && attempt < MAX_RETRIES) {
          // Wait before retry
          const delay = RETRY_DELAYS[attempt] || 6000;
          console.warn(
            `[create-metrics] SQL validation timeout (exception) on attempt ${attempt + 1}/${MAX_RETRIES + 1}. Retrying in ${delay}ms...`,
            {
              sqlPreview: `${sqlQuery.substring(0, 100)}...`,
              attempt: attempt + 1,
              nextDelay: delay,
              error: errorMessage,
            }
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue; // Retry
        }

        // Not a timeout or no more retries
        return {
          success: false,
          error: errorMessage,
        };
      }
    }

    // Should not reach here, but just in case
    return {
      success: false,
      error: 'Max retries exceeded for SQL validation',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SQL validation failed',
    };
  }
}

function generateResultMessage(
  createdFiles: FileWithId[],
  failedFiles: FailedFileCreation[]
): string {
  if (failedFiles.length === 0) {
    return `Successfully created ${createdFiles.length} metric files.`;
  }

  const successMsg =
    createdFiles.length > 0 ? `Successfully created ${createdFiles.length} metric files. ` : '';

  const failures = failedFiles.map(
    (failure) =>
      `Failed to create '${failure.name}': ${failure.error}.\n\nPlease recreate the metric from scratch rather than attempting to modify. This error could be due to:\n- Using a dataset that doesn't exist (please reevaluate the available datasets in the chat conversation)\n- Invalid configuration in the metric file\n- Special characters in the metric name or SQL query\n- Syntax errors in the SQL query`
  );

  if (failures.length === 1) {
    return `${successMsg.trim()}${failures[0]}.`;
  }

  return `${successMsg}Failed to create ${failures.length} metric files:\n${failures.join('\n')}`;
}

// Main create metric files function
const createMetricFiles = wrapTraced(
  async (
    params: CreateMetricsInput,
    context: CreateMetricsContext,
    state?: CreateMetricsState
  ): Promise<CreateMetricsOutput> => {
    // Get context values
    const userId = context.userId;
    const organizationId = context.organizationId;
    const messageId = context.messageId;
    const dataSourceId = context.dataSourceId;
    const dataSourceSyntax = context.dataSourceSyntax || 'generic';

    if (!dataSourceId) {
      return {
        message: 'Unable to identify the data source. Please refresh and try again.',
        files: [],
        failed_files: [],
      };
    }
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

    // Process files concurrently, passing metric IDs from state
    const processResults = await Promise.allSettled(
      params.files.map(async (file, index) => {
        // Ensure file has required properties
        if (!file.name || !file.yml_content) {
          return {
            fileName: file.name || 'unknown',
            result: {
              success: false,
              error: 'Missing required file properties',
            },
          };
        }
        // Get metric ID from state if available
        const metricId = state?.files?.[index]?.id;
        const result = await processMetricFile(
          file as { name: string; yml_content: string },
          dataSourceId,
          dataSourceSyntax,
          userId,
          typeof metricId === 'string' ? metricId : undefined
        );
        return { fileName: file.name, result };
      })
    );

    const successfulProcessing: Array<{
      fileName: string;
      metricFile: FileWithId;
      metricYml: ChartConfigProps;
      message: string;
      results: Record<string, unknown>[];
    }> = [];

    // Separate successful from failed processing
    for (const processResult of processResults) {
      if (processResult.status === 'fulfilled') {
        const { fileName, result } = processResult.value;
        if (
          result.success &&
          result.metricFile &&
          result.metricYml &&
          result.message &&
          result.results
        ) {
          successfulProcessing.push({
            fileName,
            metricFile: result.metricFile,
            metricYml: result.metricYml,
            message: result.message,
            results: result.results,
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
          // Insert metric files
          const metricRecords = successfulProcessing.map((sp) => ({
            id: sp.metricFile.id,
            name: sp.metricFile.name,
            fileName: sp.fileName,
            content: sp.metricYml,
            verification: 'notRequested' as const,
            evaluationObj: null,
            evaluationSummary: null,
            evaluationScore: null,
            organizationId,
            createdBy: userId,
            createdAt: sp.metricFile.created_at,
            updatedAt: sp.metricFile.updated_at,
            deletedAt: null,
            publiclyAccessible: false,
            publiclyEnabledBy: null,
            publicExpiryDate: null,
            versionHistory: createInitialMetricVersionHistory(
              sp.metricYml,
              sp.metricFile.created_at
            ),
            dataMetadata: sp.results ? createDataMetadata(sp.results) : null,
            publicPassword: null,
            dataSourceId,
          }));
          await tx.insert(metricFiles).values(metricRecords);

          // Insert asset permissions
          const assetPermissionRecords = metricRecords.map((record) => ({
            identityId: userId,
            identityType: 'user' as const,
            assetId: record.id,
            assetType: 'metric_file' as const,
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
            id: sp.metricFile.id,
            name: sp.metricFile.name,
            file_type: sp.metricFile.file_type,
            result_message: sp.metricFile.result_message || '',
            results: sp.metricFile.results || [],
            created_at: sp.metricFile.created_at,
            updated_at: sp.metricFile.updated_at,
            version_number: sp.metricFile.version_number,
          });
        }
      } catch (error) {
        // Add all successful processing to failed if database operation fails
        for (const sp of successfulProcessing) {
          failedFiles.push({
            name: sp.metricFile.name,
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
      files,
      failed_files: failedFiles,
    };
  },
  { name: 'Create Metric Files' }
);

export function createCreateMetricsExecute(
  context: CreateMetricsContext,
  state: CreateMetricsState
) {
  return wrapTraced(
    async (input: CreateMetricsInput): Promise<CreateMetricsOutput> => {
      const startTime = Date.now();

      try {
        // Call the main function directly, passing state for metric IDs
        const result = await createMetricFiles(input, context, state);

        // Update state files with final results (IDs, versions, status)
        if (result && typeof result === 'object') {
          const typedResult = result as CreateMetricsOutput;
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
                // Add error to the state file if needed (not part of the current schema)
              }
            });
          }

          // Update last entries if we have a messageId (no need for explicit entry IDs)
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

              const reasoningEntry = createCreateMetricsReasoningEntry(state, toolCallId);
              const rawLlmMessage = createCreateMetricsRawLlmMessageEntry(state, toolCallId);

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

              console.info('[create-metrics] Updated last entries with final results', {
                messageId: context.messageId,
                successCount: typedResult.files?.length || 0,
                failedCount: typedResult.failed_files?.length || 0,
              });
            } catch (error) {
              console.error('[create-metrics] Error updating final entries:', error);
              // Don't throw - return the result anyway
            }
          }
        }

        const executionTime = Date.now() - startTime;
        console.info('[create-metrics] Execution completed', {
          executionTime: `${executionTime}ms`,
          filesCreated: result?.files?.length || 0,
          filesFailed: result?.failed_files?.length || 0,
        });

        return result as CreateMetricsOutput;
      } catch (error) {
        const executionTime = Date.now() - startTime;
        console.error('[create-metrics] Execution failed', {
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

            const reasoningEntry = createCreateMetricsReasoningEntry(state, toolCallId);
            const rawLlmMessage = createCreateMetricsRawLlmMessageEntry(state, toolCallId);

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
            console.error('[create-metrics] Error updating entries on failure:', updateError);
          }
        }

        throw error;
      }
    },
    { name: 'create-metrics-execute' }
  );
}
