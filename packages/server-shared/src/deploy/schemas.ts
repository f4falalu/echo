import { z } from 'zod';

// ============================================================================
// Unified Deploy Request/Response Schemas
// ============================================================================

// Reuse the existing model schema from datasets
export const DeployModelSchema = z.object({
  name: z.string(),
  data_source_name: z.string(),
  database: z.string().optional(),
  schema: z.string(),
  description: z.string().optional(),
  sql_definition: z.string().optional(),
  yml_file: z.string().optional(),
  columns: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      semantic_type: z.string().optional(),
      expr: z.string().optional(),
      type: z.string().optional(),
      agg: z.string().optional(),
      searchable: z.boolean().optional(),
    })
  ),
});

// Schema for deploying docs (markdown files)
export const DeployDocSchema = z.object({
  name: z.string(), // filepath relative to buster.yml
  content: z.string(),
  type: z.enum(['analyst', 'normal']).default('normal'),
});

// Unified deploy request that handles both models and docs
export const UnifiedDeployRequestSchema = z.object({
  models: z.array(DeployModelSchema).default([]),
  docs: z.array(DeployDocSchema).default([]),
  deleteAbsentModels: z.boolean().default(true),
  deleteAbsentDocs: z.boolean().default(true),
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

// Unified response combining both models and docs results
export const UnifiedDeployResponseSchema = z.object({
  models: ModelDeployResultSchema,
  docs: DocDeployResultSchema,
});

// ============================================================================
// Type Exports
// ============================================================================

export type DeployModel = z.infer<typeof DeployModelSchema>;
export type DeployDoc = z.infer<typeof DeployDocSchema>;
export type UnifiedDeployRequest = z.infer<typeof UnifiedDeployRequestSchema>;
export type UnifiedDeployResponse = z.infer<typeof UnifiedDeployResponseSchema>;
export type ModelDeployResult = z.infer<typeof ModelDeployResultSchema>;
export type DocDeployResult = z.infer<typeof DocDeployResultSchema>;
export type DeploymentItem = z.infer<typeof DeploymentItemSchema>;
export type DeploymentFailure = z.infer<typeof DeploymentFailureSchema>;
