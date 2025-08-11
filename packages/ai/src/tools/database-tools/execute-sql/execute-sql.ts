import { tool } from 'ai';
import { z } from 'zod';
import type { AnalystAgentOptions } from '../../../agents/analyst-agent/analyst-agent';
import { createExecuteSqlDelta } from './execute-sql-delta';
import { createExecuteSqlExecute } from './execute-sql-execute';
import { createExecuteSqlFinish } from './execute-sql-finish';
import { createExecuteSqlStart } from './execute-sql-start';

export const ExecuteSqlInputSchema = z.object({
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

const ExecuteSqlContextSchema = z.object({
  dataSourceId: z.string().describe('ID of the data source to execute SQL against'),
  userId: z.string().describe('ID of the user executing the SQL'),
  dataSourceSyntax: z.string().describe('SQL syntax variant for the data source'),
  messageId: z.string().describe('Message ID for database updates'),
});

const ExecuteSqlStateSchema = z.object({
  toolCallId: z.string().optional().describe('The tool call ID'),
  args: z.string().optional().describe('Accumulated arguments text'),
  statements: z.array(z.string()).optional().describe('SQL statements to execute'),
  isComplete: z.boolean().optional().describe('Whether input is complete'),
  startTime: z.number().optional().describe('Execution start time'),
  executionTime: z.number().optional().describe('Total execution time in ms'),
  executionResults: z
    .array(
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
    )
    .optional()
    .describe('Execution results'),
});

export type ExecuteSqlInput = z.infer<typeof ExecuteSqlInputSchema>;
export type ExecuteSqlContext = z.infer<typeof ExecuteSqlContextSchema>;
export type ExecuteSqlState = z.infer<typeof ExecuteSqlStateSchema>;

const ExecuteSqlOutputSchema = z.object({
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

export type ExecuteSqlOutput = z.infer<typeof ExecuteSqlOutputSchema>;

// Factory function to create the execute-sql tool
export function createExecuteSqlTool(context: ExecuteSqlContext) {
  // Initialize state for streaming
  const state: ExecuteSqlState = {
    toolCallId: undefined,
    args: '',
    statements: [],
    isComplete: false,
    startTime: undefined,
    executionTime: undefined,
    executionResults: undefined,
  };

  // Create all functions with the context and state passed
  const execute = createExecuteSqlExecute(state, context);
  const onInputStart = createExecuteSqlStart(state, context);
  const onInputDelta = createExecuteSqlDelta(state, context);
  const onInputAvailable = createExecuteSqlFinish(state, context);

  return tool({
    description: `Use this to run lightweight, validation queries to understand values in columns, date ranges, etc. 
    Please limit your queries to 50 rows for performance.
    Query results will be limited to 50 rows for performance. 
    You must use the <SCHEMA_NAME>.<TABLE_NAME> syntax/qualifier for all table names. 
    Otherwise the queries wont run successfully.`,
    inputSchema: ExecuteSqlInputSchema,
    outputSchema: ExecuteSqlOutputSchema,
    execute,
    onInputStart,
    onInputDelta,
    onInputAvailable,
  });
}
