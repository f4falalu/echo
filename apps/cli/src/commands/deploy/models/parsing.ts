import { readFile } from 'node:fs/promises';
import yaml from 'js-yaml';
import type { ZodError, ZodIssue } from 'zod';
import { type Model, ModelSchema } from '../schemas';

/**
 * Result of parsing a model file - can contain both successful models and errors
 */
export interface ParseModelResult {
  models: Model[];
  errors: Array<{
    modelName?: string;
    issues: ZodIssue[];
  }>;
}

/**
 * Parse a YAML model file and return both successful models and validation errors
 * Each file contains exactly one model definition
 * Now collects ALL validation errors instead of failing on first error
 */
export async function parseModelFile(filePath: string): Promise<ParseModelResult> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const rawData = yaml.load(content) as unknown;

    if (!rawData || typeof rawData !== 'object') {
      throw new Error(`Invalid YAML structure in ${filePath}`);
    }

    // Parse as single model file (flat structure, no 'models' key)
    const parseResult = ModelSchema.safeParse(rawData);
    if (parseResult.success) {
      return {
        models: [parseResult.data],
        errors: [],
      };
    }

    // Extract and return detailed validation errors
    const errors = extractModelValidationErrors(rawData, parseResult.error);

    return {
      models: [],
      errors,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new ModelParsingError(`Error reading model file: ${error.message}`, filePath);
    }
    throw new ModelParsingError('Unknown error parsing model file', filePath);
  }
}

/**
 * Parse a YAML model file and throw on any errors (backward compatibility)
 */
export async function parseModelFileStrict(filePath: string): Promise<Model[]> {
  const result = await parseModelFile(filePath);

  if (result.errors.length > 0) {
    const allIssues = result.errors.flatMap((e) => e.issues);
    const zodError = { issues: allIssues } as ZodError;
    throw new ModelParsingError(`Failed to parse model file`, filePath, zodError);
  }

  return result.models;
}

/**
 * Extract detailed validation errors from Zod error
 */
function extractModelValidationErrors(
  rawData: unknown,
  zodError: ZodError
): Array<{ modelName?: string; issues: ZodIssue[] }> {
  // Try to get the model name if it exists and is valid
  const data = rawData as Record<string, unknown>;
  const modelName = data && typeof data.name === 'string' ? data.name : undefined;

  return [
    {
      ...(modelName !== undefined && { modelName }),
      issues: zodError.issues,
    },
  ];
}

/**
 * Validate a model against business rules
 * Returns ALL validation errors (doesn't stop at first error)
 */
export function validateModel(model: Model): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate model name
  if (!model.name || model.name.trim().length === 0) {
    errors.push('Model name is required');
  }

  // Validate that model has at least one dimension or measure
  if (model.dimensions.length === 0 && model.measures.length === 0) {
    errors.push('Model must have at least one dimension or measure');
  }

  // Check for duplicate dimension names
  const dimensionNames = new Set<string>();
  for (const dim of model.dimensions) {
    if (dimensionNames.has(dim.name)) {
      errors.push(`Duplicate dimension name: ${dim.name}`);
    }
    dimensionNames.add(dim.name);
  }

  // Check for duplicate measure names
  const measureNames = new Set<string>();
  for (const measure of model.measures) {
    if (measureNames.has(measure.name)) {
      errors.push(`Duplicate measure name: ${measure.name}`);
    }
    measureNames.add(measure.name);
  }

  // Check for duplicate metric names
  const metricNames = new Set<string>();
  for (const metric of model.metrics) {
    if (metricNames.has(metric.name)) {
      errors.push(`Duplicate metric name: ${metric.name}`);
    }
    metricNames.add(metric.name);

    // Validate metric expression
    if (!metric.expr || metric.expr.trim().length === 0) {
      errors.push(`Metric ${metric.name} must have an expression`);
    }
  }

  // Check for duplicate filter names
  const filterNames = new Set<string>();
  for (const filter of model.filters) {
    if (filterNames.has(filter.name)) {
      errors.push(`Duplicate filter name: ${filter.name}`);
    }
    filterNames.add(filter.name);

    // Validate filter expression
    if (!filter.expr || filter.expr.trim().length === 0) {
      errors.push(`Filter ${filter.name} must have an expression`);
    }
  }

  // Validate relationships
  for (const rel of model.relationships) {
    if (!rel.source_col || !rel.ref_col) {
      errors.push(`Relationship ${rel.name} must have source_col and ref_col`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Resolve model configuration by merging with config values
 * Model values take precedence over config values
 */
export function resolveModelConfig(
  model: Model,
  config: {
    data_source_name?: string | undefined;
    database?: string | undefined;
    schema?: string | undefined;
  }
): Model {
  return {
    ...model,
    data_source_name: model.data_source_name || config.data_source_name,
    database: model.database || config.database,
    schema: model.schema || config.schema,
  };
}

/**
 * Generate default SQL for a model
 * Used when no SQL file is found
 */
export function generateDefaultSQL(model: Model): string {
  const database = model.database ? `${model.database}.` : '';
  const schema = model.schema ? `${model.schema}.` : '';
  return `SELECT * FROM ${database}${schema}${model.name}`;
}

/**
 * Custom error class for model parsing errors
 */
export class ModelParsingError extends Error {
  constructor(
    message: string,
    public file: string,
    public zodError?: ZodError
  ) {
    super(message);
    this.name = 'ModelParsingError';
  }

  getDetailedMessage(): string {
    let message = `${this.message} (${this.file})`;

    if (this.zodError) {
      message += '\nValidation errors:';
      for (const issue of this.zodError.issues) {
        const path = issue.path.join('.');
        message += `\n  - ${path}: ${issue.message}`;
      }
    }

    return message;
  }
}

/**
 * Format Zod issues into readable error messages
 */
export function formatZodIssues(issues: ZodIssue[]): string[] {
  return issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
    return `${path}${issue.message}`;
  });
}
