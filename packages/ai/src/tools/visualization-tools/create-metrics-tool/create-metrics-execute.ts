import { randomUUID } from 'node:crypto';
import type { DataSource } from '@buster/data-source';
import { assetPermissions, db, metricFiles } from '@buster/database';
import { wrapTraced } from 'braintrust';
import { inArray } from 'drizzle-orm';
import * as yaml from 'yaml';
import { z } from 'zod';
import { getWorkflowDataSourceManager } from '../../../utils/data-source-manager';
import {
  createPermissionErrorMessage,
  validateSqlPermissions,
} from '../../../utils/sql-permissions';
import { validateAndAdjustBarLineAxes } from '../bar-line-axis-validator';
import { trackFileAssociations } from '../file-tracking-helper';
import { ensureTimeFrameQuoted } from '../time-frame-helper';
import { createInitialMetricVersionHistory, validateMetricYml } from '../version-history-helpers';
import type { MetricYml } from '../version-history-types';
import type {
  CreateMetricsAgentContext,
  CreateMetricsContext,
  CreateMetricsInput,
  CreateMetricsOutput,
} from './create-metrics-tool';

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
  metricYml?: MetricYml;
  message?: string;
  results?: Record<string, unknown>[];
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
  totalRowCount?: number;
  limited?: boolean;
  maxRows?: number;
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
          columnType = ColumnType.Date;
          simpleType = SimpleType.Date;
        } else {
          columnType = ColumnType.Text;
          simpleType = SimpleType.String;
        }
      }
    }

    // Calculate min, max, and unique values
    let minValue: unknown = null;
    let maxValue: unknown = null;
    const uniqueValues = new Set(values);

    if (simpleType === SimpleType.Number && values.length > 0) {
      const numericValues = values.filter((v): v is number => typeof v === 'number');
      if (numericValues.length > 0) {
        minValue = Math.min(...numericValues);
        maxValue = Math.max(...numericValues);
      }
    } else if (simpleType === SimpleType.Date && values.length > 0) {
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
      minValue = sortedValues[0];
      maxValue = sortedValues[sortedValues.length - 1];
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
  _fileName: string,
  ymlContent: string,
  dataSourceId: string,
  dataSourceDialect: string,
  userId: string,
  _organizationId: string,
  workflowId: string
): Promise<MetricFileResult> {
  try {
    // Ensure timeFrame values are properly quoted before parsing
    const fixedYmlContent = ensureTimeFrameQuoted(ymlContent);

    // Parse and validate YAML
    const parsedYml = yaml.parse(fixedYmlContent);
    const metricYml = validateMetricYml(parsedYml);

    // Validate and adjust bar/line chart axes
    const axisValidation = validateAndAdjustBarLineAxes(metricYml);
    if (!axisValidation.isValid) {
      return {
        success: false,
        error: axisValidation.error || 'Invalid bar/line chart axis configuration',
      };
    }

    // Use adjusted YAML if axes were swapped
    const finalMetricYml =
      axisValidation.shouldSwapAxes && axisValidation.adjustedYml
        ? axisValidation.adjustedYml
        : metricYml;

    // Generate deterministic UUID (simplified version)
    const metricId = randomUUID();

    // Validate SQL by running it
    const sqlValidationResult = await validateSql(
      finalMetricYml.sql,
      dataSourceId,
      workflowId,
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
      id: metricId,
      name: finalMetricYml.name,
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
  workflowId: string,
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

    // Get data source from workflow manager (reuses existing connections)
    const manager = getWorkflowDataSourceManager(workflowId);
    let dataSource: DataSource;

    try {
      dataSource = await manager.getDataSource(dataSourceId);
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
    // Note: We don't close the data source here anymore - it's managed by the workflow manager
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

// Main execute function with context mapping
export function createCreateMetricsExecute<
  TAgentContext extends CreateMetricsAgentContext = CreateMetricsAgentContext,
>(context: TAgentContext) {
  return wrapTraced(
    async (input: CreateMetricsInput): Promise<CreateMetricsOutput> => {
      // Use the passed context directly
      const toolContext: CreateMetricsContext = {
        userId: context.userId,
        chatId: context.chatId,
        dataSourceId: context.dataSourceId,
        dataSourceSyntax: context.dataSourceSyntax || 'generic',
        organizationId: context.organizationId,
        messageId: context.messageId,
      };

      const startTime = Date.now();
      const { files } = input;

      const createdFiles: FileWithId[] = [];
      const failedFiles: FailedFileCreation[] = [];

      // Extract context values
      const dataSourceId = toolContext.dataSourceId;
      const dataSourceSyntax = toolContext.dataSourceSyntax || 'generic';
      const userId = toolContext.userId;
      const organizationId = toolContext.organizationId;
      const messageId = toolContext.messageId;

      // Generate a unique workflow ID using data source
      const workflowId = `workflow-${Date.now()}-${dataSourceId}`;

      if (!dataSourceId) {
        return {
          message: 'Unable to identify the data source. Please refresh and try again.',
          duration: Date.now() - startTime,
          files: [],
          failed_files: [],
        };
      }
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

      // Process files concurrently
      const processResults = await Promise.allSettled(
        files.map(async (file) => {
          const result = await processMetricFile(
            file.name,
            file.yml_content,
            dataSourceId,
            dataSourceSyntax,
            userId,
            organizationId,
            workflowId
          );
          return { fileName: file.name, result };
        })
      );

      const successfulProcessing: Array<{
        fileName: string;
        metricFile: FileWithId;
        metricYml: MetricYml;
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

          // Critical save verification - ensure records were actually saved
          if (successfulProcessing.length > 0) {
            try {
              const savedMetricIds = successfulProcessing.map((sp) => sp.metricFile.id);
              const verificationResult = await db
                .select({ id: metricFiles.id })
                .from(metricFiles)
                .where(inArray(metricFiles.id, savedMetricIds))
                .limit(savedMetricIds.length);

              if (verificationResult.length !== savedMetricIds.length) {
                console.error('[Critical Save Verification] Mismatch in saved records:', {
                  expected: savedMetricIds.length,
                  actual: verificationResult.length,
                  messageId,
                  workflowId,
                });

                // Mark files as failed if verification doesn't match
                const savedIds = new Set(verificationResult.map((r) => r.id));
                for (const sp of successfulProcessing) {
                  if (!savedIds.has(sp.metricFile.id)) {
                    failedFiles.push({
                      name: sp.metricFile.name,
                      error: 'Critical save verification failed - record not found after save',
                    });
                  }
                }
              }
            } catch (verifyError) {
              console.error('[Critical Save Verification] Error during verification:', verifyError);
              // Don't fail the entire operation, but log the issue
            }
          }

          // Prepare successful files output
          for (const sp of successfulProcessing) {
            createdFiles.push({
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

      const duration = Date.now() - startTime;

      const message = generateResultMessage(createdFiles, failedFiles);

      // Track file associations if we have a messageId and created files
      if (messageId && createdFiles.length > 0) {
        await trackFileAssociations({
          messageId,
          files: createdFiles.map((file) => ({
            id: file.id,
            version: file.version_number,
          })),
        });
      }

      return {
        message,
        duration,
        files: createdFiles,
        failed_files: failedFiles,
      };
    },
    { name: 'create-metrics-execute' }
  );
}
