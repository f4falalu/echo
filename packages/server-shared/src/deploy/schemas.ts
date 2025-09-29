import { z } from 'zod';
// Import DeployModelSchema from datasets to avoid duplication
import { DeployModelSchema } from '../datasets/schemas';

// ============================================================================
// Unified Deploy Request/Response Schemas
// ============================================================================

// Re-export the model schema from datasets
export { DeployModelSchema };

// Schema for deploying docs (markdown files)
export const DeployDocSchema = z.object({
  name: z.string(), // filepath relative to buster.yml
  content: z.string(),
  type: z.enum(['analyst', 'normal']).default('normal'),
});

// Schema for logs configuration in buster.yml
export const LogsConfigSchema = z.object({
  database: z.string().describe('Database name for logs'),
  schema: z.string().describe('Schema name for logs'),
  table_name: z.string().optional().describe('Table name for logs (defaults to BUSTER_QUERY_LOGS)'),
});

// Schema for logs writeback configuration (API format)
export const LogsWritebackConfigSchema = z.object({
  enabled: z.boolean().describe('Whether logs writeback is enabled'),
  database: z.string().describe('Snowflake database name'),
  schema: z.string().describe('Snowflake schema name'),
  tableName: z.string().default('BUSTER_QUERY_LOGS').describe('Table name for logs'),
}).nullable().describe('Configuration for writing logs back to Snowflake');

// Unified deploy request that handles both models and docs
export const UnifiedDeployRequestSchema = z.object({
  models: z.array(DeployModelSchema).default([]),
  docs: z.array(DeployDocSchema).default([]),
  deleteAbsentModels: z.boolean().default(true),
  deleteAbsentDocs: z.boolean().default(true),
  logsWriteback: LogsWritebackConfigSchema.optional().describe('Logs writeback configuration'),
});

// Response schemas for deployment results
export const DeploymentItemSchema = z.object({
  name: z.string(),
  dataSource: z.string().optional(),
  schema: z.string().optional(),
  database: z.string().optional(),
});

export const DeploymentFailureSchema = z.object({
  name: z.string(),
  errors: z.array(z.string()),
});

export const ModelDeployResultSchema = z.object({
  success: z.array(DeploymentItemSchema).default([]),
  updated: z.array(DeploymentItemSchema).default([]),
  failures: z.array(DeploymentFailureSchema).default([]),
  deleted: z.array(z.string()).default([]),
  summary: z.object({
    totalModels: z.number(),
    successCount: z.number(),
    updateCount: z.number(),
    failureCount: z.number(),
    deletedCount: z.number(),
  }),
});

export const DocDeployResultSchema = z.object({
  created: z.array(z.string()).default([]),
  updated: z.array(z.string()).default([]),
  deleted: z.array(z.string()).default([]),
  failed: z
    .array(
      z.object({
        name: z.string(),
        error: z.string(),
      })
    )
    .default([]),
  summary: z.object({
    totalDocs: z.number(),
    createdCount: z.number(),
    updatedCount: z.number(),
    deletedCount: z.number(),
    failedCount: z.number(),
  }),
});

// Schema for logs writeback deployment result
export const LogsWritebackResultSchema = z.object({
  configured: z.boolean().describe('Whether logs writeback was configured'),
  tableCreated: z.boolean().optional().describe('Whether the table was created'),
  database: z.string().optional().describe('Database name'),
  schema: z.string().optional().describe('Schema name'),
  tableName: z.string().optional().describe('Table name'),
  error: z.string().optional().describe('Error message if configuration failed'),
});

// Unified response combining both models and docs results
export const UnifiedDeployResponseSchema = z.object({
  models: ModelDeployResultSchema,
  docs: DocDeployResultSchema,
  logsWriteback: LogsWritebackResultSchema.optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type DeployModel = z.infer<typeof DeployModelSchema>;
export type DeployDoc = z.infer<typeof DeployDocSchema>;
export type LogsConfig = z.infer<typeof LogsConfigSchema>;
export type LogsWritebackConfig = z.infer<typeof LogsWritebackConfigSchema>;
export type UnifiedDeployRequest = z.infer<typeof UnifiedDeployRequestSchema>;
export type UnifiedDeployResponse = z.infer<typeof UnifiedDeployResponseSchema>;
export type ModelDeployResult = z.infer<typeof ModelDeployResultSchema>;
export type DocDeployResult = z.infer<typeof DocDeployResultSchema>;
export type LogsWritebackResult = z.infer<typeof LogsWritebackResultSchema>;
export type DeploymentItem = z.infer<typeof DeploymentItemSchema>;
export type DeploymentFailure = z.infer<typeof DeploymentFailureSchema>;
