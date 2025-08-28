import { z } from 'zod';

// ============================================================================
// Model Schemas - Define the structure of semantic layer models
// ============================================================================

export const ArgumentSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string().optional(),
});

export const DimensionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  type: z.string().optional(),
  searchable: z.boolean().default(false),
  options: z.array(z.string()).optional(),
});

export const MeasureSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  type: z.string().optional(),
});

export const MetricSchema = z.object({
  name: z.string(),
  expr: z.string(),
  description: z.string().optional(),
  args: z.array(ArgumentSchema).default([]),
});

export const FilterSchema = z.object({
  name: z.string(),
  expr: z.string(),
  description: z.string().optional(),
  args: z.array(ArgumentSchema).default([]),
});

export const RelationshipSchema = z.object({
  name: z.string(),
  source_col: z.string(),
  ref_col: z.string(),
  type: z.string().optional(),
  cardinality: z.string().optional(),
  description: z.string().optional(),
});

export const ModelSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  data_source_name: z.string().optional(),
  database: z.string().optional(),
  schema: z.string().optional(),
  dimensions: z.array(DimensionSchema).default([]),
  measures: z.array(MeasureSchema).default([]),
  metrics: z.array(MetricSchema).default([]),
  filters: z.array(FilterSchema).default([]),
  relationships: z.array(RelationshipSchema).default([]),
});

// Support both single model and multi-model YAML files
export const SingleModelSchema = ModelSchema;
export const MultiModelSchema = z.object({
  models: z.array(ModelSchema),
});

// ============================================================================
// Configuration Schemas - Define buster.yml structure
// ============================================================================

export const ProjectContextSchema = z.object({
  name: z.string().optional(),
  data_source_name: z.string().optional(),
  database: z.string().optional(),
  schema: z.string().optional(),
  model_paths: z.array(z.string()).optional(),
  semantic_model_paths: z.array(z.string()).optional(),
  exclude_files: z.array(z.string()).optional(),
  exclude_tags: z.array(z.string()).optional(),
});

export const BusterConfigSchema = z.object({
  // Top-level fields for backwards compatibility
  data_source_name: z.string().optional(),
  database: z.string().optional(),
  schema: z.string().optional(),
  model_paths: z.array(z.string()).optional(),
  semantic_model_paths: z.array(z.string()).optional(),
  exclude_files: z.array(z.string()).optional(),
  exclude_tags: z.array(z.string()).optional(),
  // Multi-project structure (for future use)
  projects: z.array(ProjectContextSchema).optional(),
});

// Resolved config after merging CLI options, file config, and defaults
export const ResolvedConfigSchema = z.object({
  data_source_name: z.string().optional(),
  database: z.string().optional(),
  schema: z.string().optional(),
  model_paths: z.array(z.string()).default(['.']),
  semantic_model_paths: z.array(z.string()).default(['.']),
  exclude_files: z.array(z.string()).default([]),
  exclude_tags: z.array(z.string()).default([]),
});

// ============================================================================
// CLI Options Schema
// ============================================================================

export const DeployOptionsSchema = z.object({
  path: z.string().optional(),
  dataSource: z.string().optional(),
  database: z.string().optional(),
  schema: z.string().optional(),
  dryRun: z.boolean().default(false),
  recursive: z.boolean().default(true),
  verbose: z.boolean().default(false),
});

// ============================================================================
// Deployment Request/Response Schemas - For API interaction
// ============================================================================

export const DeployColumnSchema = z.object({
  name: z.string(),
  description: z.string().default(''),
  semantic_type: z.string().optional(),
  expr: z.string().optional(),
  type: z.string().optional(),
  agg: z.string().optional(),
  searchable: z.boolean().default(false),
});

export const DeployRequestSchema = z.object({
  id: z.string().optional(),
  data_source_name: z.string(),
  env: z.string().default('dev'),
  type: z.string().default('view'),
  name: z.string(),
  model: z.string().optional(),
  schema: z.string(),
  database: z.string().optional(),
  description: z.string().default(''),
  sql_definition: z.string().optional(),
  entity_relationships: z.array(z.any()).optional(),
  columns: z.array(DeployColumnSchema),
  yml_file: z.string().optional(),
});

// ============================================================================
// Deployment Result Schemas
// ============================================================================

export const DeploymentItemSchema = z.object({
  file: z.string(),
  modelName: z.string(),
  dataSource: z.string(),
});

export const DeploymentFailureSchema = z.object({
  file: z.string(),
  modelName: z.string(),
  errors: z.array(z.string()),
});

export const DeploymentExcludedSchema = z.object({
  file: z.string(),
  reason: z.string(),
});

export const DeploymentResultSchema = z.object({
  success: z.array(DeploymentItemSchema).default([]),
  updated: z.array(DeploymentItemSchema).default([]),
  noChange: z.array(DeploymentItemSchema).default([]),
  failures: z.array(DeploymentFailureSchema).default([]),
  excluded: z.array(DeploymentExcludedSchema).default([]),
});

// ============================================================================
// Type Exports - Inferred from schemas
// ============================================================================

export type Argument = z.infer<typeof ArgumentSchema>;
export type Dimension = z.infer<typeof DimensionSchema>;
export type Measure = z.infer<typeof MeasureSchema>;
export type Metric = z.infer<typeof MetricSchema>;
export type Filter = z.infer<typeof FilterSchema>;
export type Relationship = z.infer<typeof RelationshipSchema>;
export type Model = z.infer<typeof ModelSchema>;

export type ProjectContext = z.infer<typeof ProjectContextSchema>;
export type BusterConfig = z.infer<typeof BusterConfigSchema>;
export type ResolvedConfig = z.infer<typeof ResolvedConfigSchema>;
export type DeployOptions = z.infer<typeof DeployOptionsSchema>;

export type DeployColumn = z.infer<typeof DeployColumnSchema>;
export type DeployRequest = z.infer<typeof DeployRequestSchema>;

export type DeploymentItem = z.infer<typeof DeploymentItemSchema>;
export type DeploymentFailure = z.infer<typeof DeploymentFailureSchema>;
export type DeploymentExcluded = z.infer<typeof DeploymentExcludedSchema>;
export type DeploymentResult = z.infer<typeof DeploymentResultSchema>;
