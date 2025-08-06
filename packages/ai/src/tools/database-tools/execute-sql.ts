import { type DataSource, withRateLimit } from '@buster/data-source';
import { tool } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import type { AnalystAgentOptions } from '../../agents/analyst-agent/analyst-agent';
import { getWorkflowDataSourceManager } from '../../utils/data-source-manager';
import { createPermissionErrorMessage, validateSqlPermissions } from '../../utils/sql-permissions';
import type { AnalystRuntimeContext } from '../../workflows/analyst-workflow';

const executeSqlStatementInputSchema = z.object({
  statements: z.array(z.string()).describe(
    `Array of lightweight, optimized SQL statements to execute. 
      Each statement should be small and focused. 
      SELECT queries without a LIMIT clause will automatically have LIMIT 50 added for performance.
      Existing LIMIT clauses will be preserved.
      YOU MUST USE THE <SCHEMA_NAME>.<TABLE_NAME> syntax/qualifier for all table names. 
      NEVER use SELECT * on physical tables - for security purposes you must explicitly select the columns you intend to use. NOT ADHERING TO THESE INSTRUCTIONS WILL RETURN AN ERROR
      NEVER query system tables or use 'SHOW' statements as these will fail to execute.
      Queries without these requirements will fail to execute.`
  ),
});

/**
 * Processes a single column value for truncation
 */
function processColumnValue(value: unknown, maxLength: number): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return value.length > maxLength ? `${value.slice(0, maxLength)}...[TRUNCATED]` : value;
  }

  if (typeof value === 'object') {
    // Always stringify objects/arrays to prevent parser issues
    const stringValue = JSON.stringify(value);
    return stringValue.length > maxLength
      ? `${stringValue.slice(0, maxLength)}...[TRUNCATED]`
      : stringValue;
  }

  // For numbers, booleans, etc.
  const stringValue = String(value);
  return stringValue.length > maxLength
    ? `${stringValue.slice(0, maxLength)}...[TRUNCATED]`
    : value; // Keep original value and type if not too long
}

/**
 * Truncates query results to prevent overwhelming responses with large JSON objects, arrays, or text
 * Always converts objects/arrays to strings to ensure parser safety
 */
function truncateQueryResults(
  rows: Record<string, unknown>[],
  maxLength = 100
): Record<string, unknown>[] {
  return rows.map((row) => {
    const truncatedRow: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(row)) {
      truncatedRow[key] = processColumnValue(value, maxLength);
    }

    return truncatedRow;
  });
}

// Remove parseStreamingArgs as it's no longer needed with AI SDK v5
// The SDK handles streaming parsing internally

const executeSqlStatementOutputSchema = z.object({
  results: z.array(
    z.discriminatedUnion('status', [
      z.object({
        status: z.literal('success'),
        sql: z.string(),
        results: z.array(z.record(z.unknown())),
      }),
      z.object({
        status: z.literal('error'),
        sql: z.string(),
        error_message: z.string(),
      }),
    ])
  ),
});

const executeSqlStatement = wrapTraced(
  async (
    params: z.infer<typeof executeSqlStatementInputSchema>,
    context: AnalystAgentOptions
  ): Promise<z.infer<typeof executeSqlStatementOutputSchema>> => {
    let { statements } = params;

    // Handle various edge cases for statements
    if (statements === undefined || statements === null) {
      console.error('[execute-sql] Invalid input: statements is undefined or null', {
        params: params,
      });
      return {
        results: [
          {
            status: 'error' as const,
            sql: '',
            error_message: 'Invalid input: statements is required',
          },
        ],
      };
    }

    // If statements is not an array, try to convert it
    if (!Array.isArray(statements)) {
      console.error('[execute-sql] Invalid input: statements is not an array', {
        type: typeof statements,
        value: statements,
        params: params,
      });

      // Try to recover from common edge cases
      if (typeof statements === 'string') {
        const stringStatement = statements;
        try {
          // Try parsing as JSON array
          const parsed = JSON.parse(stringStatement);
          if (Array.isArray(parsed)) {
            statements = parsed;
            console.warn('[execute-sql] Recovered statements from JSON string');
          } else {
            // Treat as single statement
            statements = [stringStatement];
            console.warn('[execute-sql] Treating string as single statement');
          }
        } catch {
          // Treat as single statement
          statements = [stringStatement];
          console.warn('[execute-sql] Treating unparseable string as single statement');
        }
      } else if (typeof statements === 'object' && statements !== null) {
        // Handle object with map method that's not an array (edge case)
        if ('map' in statements && typeof (statements as { map?: unknown }).map === 'function') {
          try {
            statements = Array.from(statements as Iterable<string>);
            console.warn('[execute-sql] Recovered statements from array-like object');
          } catch {
            return {
              results: [
                {
                  status: 'error' as const,
                  sql: JSON.stringify(statements),
                  error_message: 'Invalid input: statements must be an array of SQL strings',
                },
              ],
            };
          }
        } else {
          return {
            results: [
              {
                status: 'error' as const,
                sql: JSON.stringify(statements),
                error_message: 'Invalid input: statements must be an array of SQL strings',
              },
            ],
          };
        }
      } else {
        return {
          results: [
            {
              status: 'error' as const,
              sql: String(statements),
              error_message: 'Invalid input: statements must be an array of SQL strings',
            },
          ],
        };
      }
    }

    // Final validation - ensure all elements are strings
    if (!statements.every((stmt) => typeof stmt === 'string')) {
      console.error('[execute-sql] Invalid input: statements contains non-string elements', {
        statements: statements,
      });
      statements = statements.map((stmt) => String(stmt));
    }

    // Check for empty array
    if (statements.length === 0) {
      return {
        results: [],
      };
    }

    const dataSourceId = context.dataSourceId;
    const workflowStartTime = context.get('workflowStartTime') as number | undefined;

    // Generate a unique workflow ID using start time and data source
    const workflowId = workflowStartTime
      ? `workflow-${workflowStartTime}-${dataSourceId}`
      : `workflow-${Date.now()}-${dataSourceId}`;

    // Get data source from workflow manager (reuses existing connections)
    const manager = getWorkflowDataSourceManager(workflowId);

    try {
      const dataSource = await manager.getDataSource(dataSourceId);

      // Execute SQL statements with rate limiting
      const executionPromises = statements.map((sqlStatement) =>
        withRateLimit(
          'sql-execution',
          async () => {
            const result = await executeSingleStatement(sqlStatement, dataSource, runtimeContext);
            return { sql: sqlStatement, result };
          },
          {
            maxConcurrent: 50, // Increased from 10 to allow more concurrent queries per workflow
            maxPerSecond: 100, // Increased from 25 to handle higher throughput
            maxPerMinute: 3000, // Increased from 300 for sustained load
            queueTimeout: 180000, // 180 seconds (increased for queue management)
          }
        )
      );

      // Wait for all executions to complete
      const executionResults = await Promise.allSettled(executionPromises);

      // Process results
      const results: z.infer<typeof executeSqlStatementOutputSchema>['results'] =
        executionResults.map((executionResult, index) => {
          const sql = statements[index] || '';

          if (executionResult.status === 'fulfilled') {
            const { result } = executionResult.value;
            if (result.success) {
              return {
                status: 'success' as const,
                sql,
                results: result.data || [],
              };
            }
            return {
              status: 'error' as const,
              sql,
              error_message: result.error || 'Unknown error occurred',
            };
          }

          return {
            status: 'error' as const,
            sql,
            error_message: executionResult.reason?.message || 'Execution failed',
          };
        });

      return { results };
    } catch (error) {
      // If we can't get data source, return error for all statements
      console.error('[execute-sql] Failed to get data source:', error);
      return {
        results: statements.map((sql) => ({
          status: 'error' as const,
          sql,
          error_message: `Unable to connect to your data source. Please check that it's properly configured and accessible.`,
        })),
      };
    }
    // Note: We don't close the data source here anymore - it's managed by the workflow manager
  },
  { name: 'execute-sql' }
);

async function executeSingleStatement(
  sqlStatement: string,
  dataSource: DataSource,
  runtimeContext: RuntimeContext<AnalystRuntimeContext>
): Promise<{
  success: boolean;
  data?: Record<string, unknown>[];
  error?: string;
}> {
  // Retry configuration
  const MAX_RETRIES = 3;
  const TIMEOUT_MS = 30000; // 30 seconds
  const RETRY_DELAYS = [1000, 3000, 6000]; // 1s, 3s, 6s

  if (!sqlStatement.trim()) {
    return { success: false, error: 'SQL statement cannot be empty' };
  }

  // Validate permissions before execution
  const userId = runtimeContext.get('userId');
  if (!userId) {
    return { success: false, error: 'User authentication required for SQL execution' };
  }

  const dataSourceSyntax = runtimeContext.get('dataSourceSyntax');
  const permissionResult = await validateSqlPermissions(sqlStatement, userId, dataSourceSyntax);
  if (!permissionResult.isAuthorized) {
    return {
      success: false,
      error: createPermissionErrorMessage(permissionResult.unauthorizedTables),
    };
  }

  // Attempt execution with retries
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Execute the SQL query using the DataSource with timeout
      // Pass maxRows to the adapter instead of modifying the SQL
      const result = await dataSource.execute({
        sql: sqlStatement,
        options: {
          timeout: TIMEOUT_MS,
          maxRows: 50, // Limit results at the adapter level, not in SQL
        },
      });

      if (result.success) {
        return {
          success: true,
          data: truncateQueryResults(result.rows || []),
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
          `[execute-sql] Query timeout on attempt ${attempt + 1}/${MAX_RETRIES + 1}. Retrying in ${delay}ms...`,
          {
            sql: `${sqlStatement.substring(0, 100)}...`,
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
      const errorMessage = error instanceof Error ? error.message : 'SQL execution failed';
      const isTimeout =
        errorMessage.toLowerCase().includes('timeout') ||
        errorMessage.toLowerCase().includes('timed out');

      if (isTimeout && attempt < MAX_RETRIES) {
        // Wait before retry
        const delay = RETRY_DELAYS[attempt] || 6000;
        console.warn(
          `[execute-sql] Query timeout (exception) on attempt ${attempt + 1}/${MAX_RETRIES + 1}. Retrying in ${delay}ms...`,
          {
            sql: `${sqlStatement.substring(0, 100)}...`,
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
    error: 'Max retries exceeded for SQL execution',
  };
}

// Export the tool
export const executeSql = tool({
  description: `Use this to run lightweight, validation queries to understand values in columns, date ranges, etc. 
    Please limit your queries to 50 rows for performance.
    Query results will be limited to 50 rows for performance. 
    You must use the <SCHEMA_NAME>.<TABLE_NAME> syntax/qualifier for all table names. 
    Otherwise the queries wont run successfully.`,
  inputSchema: executeSqlStatementInputSchema,
  outputSchema: executeSqlStatementOutputSchema,
  execute: async (input, { experimental_context: context }) => {
    return await executeSqlStatement(input, context as AnalystAgentOptions);
  },
});

export default executeSql;
