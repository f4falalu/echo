import { readFile } from 'node:fs/promises';
import yaml from 'js-yaml';
import type { ZodError } from 'zod';
import { type Model, ModelSchema, MultiModelSchema, SingleModelSchema } from '../schemas';

/**
 * Parse a YAML model file and return an array of models
 * Supports both single model and multi-model files
 */
export async function parseModelFile(filePath: string): Promise<Model[]> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const rawData = yaml.load(content) as unknown;

    if (!rawData || typeof rawData !== 'object') {
      throw new Error(`Invalid YAML structure in ${filePath}`);
    }

    // Try parsing as multi-model file first (has 'models' key)
    const multiResult = MultiModelSchema.safeParse(rawData);
    if (multiResult.success) {
      return multiResult.data.models;
    }

    // Try parsing as single model file
    const singleResult = SingleModelSchema.safeParse(rawData);
    if (singleResult.success) {
      return [singleResult.data];
    }

    // If neither works, throw the multi-model error (more informative)
    throw new ModelParsingError(`Failed to parse model file`, filePath, multiResult.error);
  } catch (error) {
    if (error instanceof ModelParsingError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new ModelParsingError(`Error reading model file: ${error.message}`, filePath);
    }

    throw new ModelParsingError('Unknown error parsing model file', filePath);
  }
}

/**
 * Validate a model against business rules
 * Returns validation errors if any
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
