import type { DataSource } from '@buster/data-source';
import { db, metricFiles, updateMessageFields } from '@buster/database';
import { wrapTraced } from 'braintrust';
import { eq, inArray } from 'drizzle-orm';
import * as yaml from 'yaml';
import { z } from 'zod';
import { getDataSource } from '../../../utils/get-data-source';
import {
  createPermissionErrorMessage,
  validateSqlPermissions,
} from '../../../utils/sql-permissions';
import { validateAndAdjustBarLineAxes } from '../bar-line-axis-validator';
import { trackFileAssociations } from '../file-tracking-helper';
import { ensureTimeFrameQuoted } from '../time-frame-helper';
import {
  addMetricVersionToHistory,
  getLatestVersionNumber,
  validateMetricYml,
} from '../version-history-helpers';
import type { MetricYml, VersionHistory } from '../version-history-types';
import { createModifyMetricsReasoningMessage } from './helpers/modify-metrics-tool-transform-helper';
import type {
  ModifyMetricsAgentContext,
  ModifyMetricsInput,
  ModifyMetricsOutput,
  ModifyMetricsState,
} from './modify-metrics-tool';

// TypeScript types matching Rust DataMetadata structure
enum SimpleType {
  Number = 'number',
  String = 'string',
  Date = 'date',
  Boolean = 'boolean',
  Other = 'other',
}

enum ColumnType {
  Int2 = 'int2',
  Int4 = 'int4',
  Int8 = 'int8',
  Float4 = 'float4',
  Float8 = 'float8',
  Varchar = 'varchar',
  Text = 'text',
  Bool = 'bool',
  Date = 'date',
  Timestamp = 'timestamp',
  Timestamptz = 'timestamptz',
  Other = 'other',
}

interface ColumnMetaData {
  name: string;
  min_value: unknown;
  max_value: unknown;
  unique_values: number;
  simple_type: SimpleType;
  type: ColumnType;
}

interface DataMetadata {
  column_count: number;
  row_count: number;
  column_metadata: ColumnMetaData[];
}

// Core interfaces matching Rust structs
interface FileUpdate {
  id: string;
  yml_content: string;
}

interface UpdateFilesParams {
  files: FileUpdate[];
}

interface FailedFileModification {
  file_name: string;
  error: string;
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
}

interface ModifyFilesOutput {
  message: string;
  duration: number;
  files: FileWithId[];
  failed_files: FailedFileModification[];
}

interface ModificationResult {
  file_id: string;
  file_name: string;
  success: boolean;
  error?: string;
  modification_type: string;
  timestamp: string;
  duration: number;
}

// Zod schema for validating result metadata from DataSource
const resultMetadataSchema = z
  .object({
    totalRowCount: z.number().optional(),
    limited: z.boolean().optional(),
    maxRows: z.number().optional(),
  })
  .optional();

type ResultMetadata = z.infer<typeof resultMetadataSchema>;

interface QueryMetadata {
  rowCount: number;
  totalRowCount: number;
  executionTime: number;
  limited: boolean;
  maxRows?: number;
}

interface SqlValidationResult {
  success: boolean;
  message?: string;
  results?: Record<string, unknown>[];
  metadata?: QueryMetadata;
  error?: string;
}

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
    let columnType = ColumnType.Other;
    let simpleType = SimpleType.Other;

    if (values.length > 0) {
      const firstValue = values[0];

      if (typeof firstValue === 'number') {
        columnType = Number.isInteger(firstValue) ? ColumnType.Int4 : ColumnType.Float8;
        simpleType = SimpleType.Number;
      } else if (typeof firstValue === 'boolean') {
        columnType = ColumnType.Bool;
        simpleType = SimpleType.Boolean;
      } else if (firstValue instanceof Date) {
        columnType = ColumnType.Timestamp;
        simpleType = SimpleType.Date;
      } else if (typeof firstValue === 'string') {
        // Check if it's a numeric string first
        if (!Number.isNaN(Number(firstValue))) {
          columnType = Number.isInteger(Number(firstValue)) ? ColumnType.Int4 : ColumnType.Float8;
          simpleType = SimpleType.Number;
        } else if (
          !Number.isNaN(Date.parse(firstValue)) &&
          // Additional check to avoid parsing simple numbers as dates
          (firstValue.includes('-') || firstValue.includes('/') || firstValue.includes(':'))
        ) {
          columnType = ColumnType.Timestamp;
          simpleType = SimpleType.Date;
        } else {
          columnType = ColumnType.Varchar;
          simpleType = SimpleType.String;
        }
      }
    }

    // Calculate min/max values
    let minValue: unknown = null;
    let maxValue: unknown = null;

    if (values.length > 0) {
      if (simpleType === SimpleType.Number) {
        const numValues = values
          .map((v) => {
            if (typeof v === 'number') return v;
            if (typeof v === 'string' && !Number.isNaN(Number(v))) return Number(v);
            return null;
          })
          .filter((v) => v !== null) as number[];
        if (numValues.length > 0) {
          minValue = Math.min(...numValues);
          maxValue = Math.max(...numValues);
        }
      } else if (simpleType === SimpleType.Date) {
        const dateValues = values
          .map((v) => {
            if (v instanceof Date) return v;
            if (typeof v === 'string') {
              const parsed = new Date(v);
              return Number.isNaN(parsed.getTime()) ? null : parsed;
            }
            return null;
          })
          .filter((d) => d !== null) as Date[];

        if (dateValues.length > 0) {
          minValue = new Date(Math.min(...dateValues.map((d) => d.getTime())));
          maxValue = new Date(Math.max(...dateValues.map((d) => d.getTime())));
        }
      } else if (simpleType === SimpleType.String) {
        const strValues = values.filter((v) => typeof v === 'string') as string[];
        if (strValues.length > 0) {
          minValue = strValues.sort()[0];
          maxValue = strValues.sort().reverse()[0];
        }
      }
    }

    // Calculate unique values count
    const uniqueValues = new Set(values).size;

    columnMetadata.push({
      name: columnName.toLowerCase(),
      min_value: minValue,
      max_value: maxValue,
      unique_values: uniqueValues,
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

// Replace the basic SQL validation with comprehensive validation
async function validateSql(
  sqlQuery: string,
  dataSourceId: string,
  userId: string,
  dataSourceSyntax?: string
): Promise<SqlValidationResult> {
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
          const parsedMetadata: ResultMetadata = validatedMetadata.success
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
            `[modify-metrics] SQL validation timeout on attempt ${attempt + 1}/${MAX_RETRIES + 1}. Retrying in ${delay}ms...`,
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
            `[modify-metrics] SQL validation timeout (exception) on attempt ${attempt + 1}/${MAX_RETRIES + 1}. Retrying in ${delay}ms...`,
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
  } finally {
    // Always close the data source to clean up connections
    if (dataSource) {
      try {
        await dataSource.close();
      } catch (closeError) {
        console.warn('[modify-metrics] Error closing data source:', closeError);
      }
    }
  }
}

// Process a metric file update with complete new YAML content
async function processMetricFileUpdate(
  existingFile: typeof metricFiles.$inferSelect,
  ymlContent: string,
  dataSourceId: string,
  duration: number,
  userId: string,
  dataSourceSyntax?: string
): Promise<{
  success: boolean;
  updatedFile?: typeof metricFiles.$inferSelect;
  metricYml?: MetricYml;
  modificationResults: ModificationResult[];
  validationMessage: string;
  validationResults: Record<string, unknown>[];
  validatedDatasetIds: string[];
  error?: string;
}> {
  const modificationResults: ModificationResult[] = [];
  const timestamp = new Date().toISOString();

  try {
    // Ensure timeFrame values are properly quoted before parsing
    const fixedYmlContent = ensureTimeFrameQuoted(ymlContent);

    // Parse and validate YAML
    const parsedYml = yaml.parse(fixedYmlContent);
    const metricYml = validateMetricYml(parsedYml);

    // Validate and adjust bar/line chart axes
    const axisValidation = validateAndAdjustBarLineAxes(metricYml);
    if (!axisValidation.isValid) {
      const error = axisValidation.error || 'Invalid bar/line chart axis configuration';
      modificationResults.push({
        file_id: existingFile.id,
        file_name: existingFile.name,
        success: false,
        error,
        modification_type: 'axis_validation',
        timestamp,
        duration,
      });
      return {
        success: false,
        modificationResults,
        validationMessage: '',
        validationResults: [],
        validatedDatasetIds: [],
        error,
      };
    }

    // Use adjusted YAML if axes were swapped
    const newMetricYml =
      axisValidation.shouldSwapAxes && axisValidation.adjustedYml
        ? axisValidation.adjustedYml
        : metricYml;

    // Check if SQL has changed to avoid unnecessary validation
    const existingContent = existingFile.content as MetricYml | null;
    const sqlChanged = existingContent?.sql !== newMetricYml.sql;

    // If SQL hasn't changed, we can skip validation
    if (!sqlChanged && existingFile.dataMetadata) {
      modificationResults.push({
        file_id: existingFile.id,
        file_name: newMetricYml.name,
        success: true,
        modification_type: 'content',
        timestamp,
        duration,
      });

      return {
        success: true,
        updatedFile: {
          ...existingFile,
          content: newMetricYml,
          name: newMetricYml.name,
          updatedAt: new Date().toISOString(),
          // Keep existing metadata since SQL hasn't changed
        },
        metricYml: newMetricYml,
        modificationResults,
        validationMessage: 'SQL unchanged, validation skipped',
        validationResults: [],
        validatedDatasetIds: [],
      };
    }

    // Validate SQL if it has changed or if metadata is missing
    const sqlValidation = await validateSql(
      newMetricYml.sql,
      dataSourceId,
      userId,
      dataSourceSyntax
    );
    if (!sqlValidation.success) {
      const error = `SQL validation failed: ${sqlValidation.error}`;
      modificationResults.push({
        file_id: existingFile.id,
        file_name: newMetricYml.name,
        success: false,
        error,
        modification_type: 'sql_validation',
        timestamp,
        duration,
      });
      return {
        success: false,
        modificationResults,
        validationMessage: '',
        validationResults: [],
        validatedDatasetIds: [],
        error,
      };
    }

    // Track successful update
    modificationResults.push({
      file_id: existingFile.id,
      file_name: newMetricYml.name,
      success: true,
      modification_type: 'content',
      timestamp,
      duration,
    });

    return {
      success: true,
      updatedFile: {
        ...existingFile,
        content: newMetricYml,
        name: newMetricYml.name,
        updatedAt: new Date().toISOString(),
        dataMetadata: sqlValidation.results ? createDataMetadata(sqlValidation.results) : null,
      },
      metricYml: newMetricYml,
      modificationResults,
      validationMessage: sqlChanged
        ? sqlValidation.message || 'SQL validation completed'
        : 'Metadata missing, validation completed',
      validationResults: sqlValidation.results || [],
      validatedDatasetIds: [],
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

    const errorMessage2 = errorMessage;
    modificationResults.push({
      file_id: existingFile.id,
      file_name: existingFile.name,
      success: false,
      error: errorMessage2,
      modification_type: 'validation',
      timestamp,
      duration,
    });
    return {
      success: false,
      modificationResults,
      validationMessage: '',
      validationResults: [],
      validatedDatasetIds: [],
      error: errorMessage2,
    };
  }
}

// Main modify metrics function
const modifyMetricFiles = wrapTraced(
  async (
    params: UpdateFilesParams,
    context: ModifyMetricsAgentContext
  ): Promise<ModifyFilesOutput> => {
    const startTime = Date.now();

    // Get context values
    const dataSourceId = context.dataSourceId;
    const userId = context.userId;
    const organizationId = context.organizationId;
    const messageId = context.messageId;
    const dataSourceSyntax = context.dataSourceSyntax;

    if (!dataSourceId) {
      return {
        message: 'Data source ID not found in runtime context',
        duration: Date.now() - startTime,
        files: [],
        failed_files: [],
      };
    }
    if (!userId) {
      return {
        message: 'User ID not found in runtime context',
        duration: Date.now() - startTime,
        files: [],
        failed_files: [],
      };
    }
    if (!organizationId) {
      return {
        message: 'Organization ID not found in runtime context',
        duration: Date.now() - startTime,
        files: [],
        failed_files: [],
      };
    }

    const files: FileWithId[] = [];
    const failedFiles: FailedFileModification[] = [];

    // Extract file IDs
    const metricIds = params.files.map((f) => f.id);
    const fileMap = new Map(params.files.map((f) => [f.id, f]));

    try {
      // Fetch existing metric files
      const existingFiles = await db
        .select()
        .from(metricFiles)
        .where(inArray(metricFiles.id, metricIds))
        .execute();

      if (existingFiles.length === 0) {
        return {
          message: 'No metric files found with the provided IDs',
          duration: Date.now() - startTime,
          files: [],
          failed_files: [],
        };
      }

      // Process updates concurrently
      const updatePromises = existingFiles.map(async (existingFile) => {
        const fileUpdate = fileMap.get(existingFile.id);
        if (!fileUpdate) {
          return {
            fileName: existingFile.name,
            error: 'File update not found in request',
          };
        }

        try {
          const result = await processMetricFileUpdate(
            existingFile,
            fileUpdate.yml_content,
            dataSourceId,
            Date.now() - startTime,
            userId,
            dataSourceSyntax
          );

          if (!result.success) {
            return {
              fileName: existingFile.name,
              error: result.error || 'Unknown error',
            };
          }

          return {
            fileName: existingFile.name,
            success: true,
            updatedFile: result.updatedFile,
            metricYml: result.metricYml,
            validationMessage: result.validationMessage,
            validationResults: result.validationResults,
          };
        } catch (error) {
          return {
            fileName: existingFile.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      });

      const results = await Promise.all(updatePromises);

      // Separate successful and failed updates
      const successfulUpdates: Array<{
        file: typeof metricFiles.$inferSelect;
        metricYml: MetricYml;
      }> = [];

      for (const result of results) {
        if ('success' in result && result.success && result.updatedFile && result.metricYml) {
          successfulUpdates.push({
            file: result.updatedFile,
            metricYml: result.metricYml,
          });
        } else {
          failedFiles.push({
            file_name: 'fileName' in result ? result.fileName : 'Unknown file',
            error: `Failed to modify '${result.fileName}': ${result.error}.

Please attempt to modify the metric again. This error could be due to:
- Using a dataset that doesn't exist (please reevaluate the available datasets in the chat conversation)
- Invalid configuration in the metric file
- Special characters in the metric name or SQL query
- Syntax errors in the SQL query`,
          });
        }
      }

      // Update successful files in database
      if (successfulUpdates.length > 0) {
        // Process each successful update
        for (const { file, metricYml } of successfulUpdates) {
          // Get current version history
          const currentVersionHistory = file.versionHistory as VersionHistory | null;

          // Add new version to history
          const updatedVersionHistory = addMetricVersionToHistory(
            currentVersionHistory,
            metricYml,
            new Date().toISOString()
          );

          // Get the latest version number
          const latestVersion = getLatestVersionNumber(updatedVersionHistory);

          await db
            .update(metricFiles)
            .set({
              content: metricYml,
              name: metricYml.name,
              updatedAt: new Date().toISOString(),
              dataMetadata: file.dataMetadata,
              versionHistory: updatedVersionHistory,
            })
            .where(eq(metricFiles.id, file.id))
            .execute();

          // Critical save verification
          const verificationResult = await db
            .select({
              id: metricFiles.id,
              updatedAt: metricFiles.updatedAt,
              name: metricFiles.name,
            })
            .from(metricFiles)
            .where(eq(metricFiles.id, file.id))
            .limit(1);

          if (verificationResult.length === 0) {
            throw new Error('Critical save verification failed - record not found after update');
          }

          // Add to successful files output
          files.push({
            id: file.id,
            name: metricYml.name,
            file_type: 'metric',
            result_message:
              results.find((r) => 'success' in r && r.updatedFile?.id === file.id)
                ?.validationMessage || '',
            results:
              results.find((r) => 'success' in r && r.updatedFile?.id === file.id)
                ?.validationResults || [],
            created_at: file.createdAt,
            updated_at: file.updatedAt,
            version_number: latestVersion,
          });
        }
      }
    } catch (error) {
      return {
        message: `Failed to modify metric files: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        files: [],
        failed_files: [],
      };
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

    // Generate result message
    const successCount = files.length;
    const failureCount = failedFiles.length;

    let message: string;
    if (successCount > 0 && failureCount === 0) {
      message = `Successfully modified ${successCount} metric file${successCount === 1 ? '' : 's'}.`;
    } else if (successCount === 0 && failureCount > 0) {
      message = `Failed to modify ${failureCount} metric file${failureCount === 1 ? '' : 's'}.`;
    } else if (successCount > 0 && failureCount > 0) {
      message = `Successfully modified ${successCount} metric file${successCount === 1 ? '' : 's'}, ${failureCount} failed.`;
    } else {
      message = 'No metric files were processed.';
    }

    return {
      message,
      duration: Date.now() - startTime,
      files,
      failed_files: failedFiles,
    };
  },
  { name: 'modify-metric-files' }
);

export function createModifyMetricsExecute<
  TAgentContext extends ModifyMetricsAgentContext = ModifyMetricsAgentContext,
>(context: TAgentContext, state: ModifyMetricsState) {
  return wrapTraced(
    async (input: ModifyMetricsInput): Promise<ModifyMetricsOutput> => {
      const startTime = Date.now();
      const messageId = context?.messageId;

      try {
        // Call the main function directly instead of delegating
        const result = await modifyMetricFiles(input as UpdateFilesParams, context);

        // Update state files with results
        if (result.files && Array.isArray(result.files)) {
          result.files.forEach((file) => {
            const stateFile = state.files.find((f) => f.id === file.id);
            if (stateFile) {
              stateFile.status = 'completed';
              stateFile.name = file.name;
              stateFile.version = file.version_number;
            }
          });
        }

        // Handle failed files
        if (result.failed_files && Array.isArray(result.failed_files)) {
          result.failed_files.forEach((failedFile) => {
            // Try to match by name since failed files might not have IDs
            const stateFile = state.files.find((f) => f.name === failedFile.file_name);
            if (stateFile) {
              stateFile.status = 'failed';
              stateFile.error = failedFile.error;
            }
          });
        }

        // Create final reasoning entry if messageId exists
        if (messageId && state.reasoningEntryId) {
          try {
            const finalStatus = result.failed_files?.length > 0 ? 'completed' : 'completed';
            const reasoningEntry = createModifyMetricsReasoningMessage(
              state.toolCallId || `modify-metrics-${Date.now()}`,
              state.files,
              finalStatus
            );

            console.info('[modify-metrics] Updating database with execution results', {
              messageId,
              successCount: result.files?.length || 0,
              failedCount: result.failed_files?.length || 0,
              executionTime: Date.now() - startTime,
            });

            await updateMessageFields(messageId, {
              reasoning: [reasoningEntry],
            });
          } catch (error) {
            console.error('[modify-metrics] Failed to update database with execution results', {
              messageId,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        return result as ModifyMetricsOutput;
      } catch (error) {
        // Update all files as failed if execution throws
        state.files.forEach((file) => {
          file.status = 'failed';
          file.error = error instanceof Error ? error.message : 'Unknown error';
        });

        // Update database with failure status
        if (messageId && state.reasoningEntryId) {
          try {
            const reasoningEntry = createModifyMetricsReasoningMessage(
              state.toolCallId || `modify-metrics-${Date.now()}`,
              state.files,
              'failed'
            );

            await updateMessageFields(messageId, {
              reasoning: [reasoningEntry],
            });
          } catch (dbError) {
            console.error('[modify-metrics] Failed to update database with error status', {
              messageId,
              error: dbError instanceof Error ? dbError.message : 'Unknown error',
            });
          }
        }

        throw error;
      }
    },
    { name: 'modify-metrics-execute' }
  );
}
