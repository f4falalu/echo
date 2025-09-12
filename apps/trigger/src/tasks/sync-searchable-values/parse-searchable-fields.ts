import { logger } from '@trigger.dev/sdk';
import yaml from 'js-yaml';

/**
 * Represents a searchable field extracted from a dataset YAML
 */
export interface SearchableField {
  name: string;
  type: 'dimension' | 'measure';
  description?: string;
  dataType?: string;
}

/**
 * Dataset YAML structure based on the semantic layer spec
 */
interface DatasetYaml {
  dimensions?: Array<{
    name: string;
    description?: string;
    type?: string;
    searchable?: boolean;
    options?: string[];
  }>;
  measures?: Array<{
    name: string;
    description?: string;
    type?: string;
    searchable?: boolean;
  }>;
  // Other fields we don't need for searchable extraction
  metrics?: unknown[];
  filters?: unknown[];
  relationships?: unknown[];
}

/**
 * Parse YAML content and extract fields marked as searchable
 *
 * @param ymlContent - Raw YAML content from the datasets table
 * @returns Array of searchable fields found in the YAML
 */
export function parseSearchableFields(ymlContent: string): SearchableField[] {
  const searchableFields: SearchableField[] = [];

  try {
    // Parse the YAML content
    const parsedYaml = yaml.load(ymlContent) as DatasetYaml;

    if (!parsedYaml) {
      logger.warn('Empty or invalid YAML content');
      return searchableFields;
    }

    // Extract searchable dimensions
    if (parsedYaml.dimensions && Array.isArray(parsedYaml.dimensions)) {
      for (const dimension of parsedYaml.dimensions) {
        if (dimension.searchable === true) {
          searchableFields.push({
            name: dimension.name,
            type: 'dimension',
            ...(dimension.description && { description: dimension.description }),
            ...(dimension.type && { dataType: dimension.type }),
          });

          logger.debug('Found searchable dimension', {
            name: dimension.name,
            description: dimension.description,
          });
        }
      }
    }

    // Extract searchable measures
    if (parsedYaml.measures && Array.isArray(parsedYaml.measures)) {
      for (const measure of parsedYaml.measures) {
        if (measure.searchable === true) {
          searchableFields.push({
            name: measure.name,
            type: 'measure',
            ...(measure.description && { description: measure.description }),
            ...(measure.type && { dataType: measure.type }),
          });

          logger.debug('Found searchable measure', {
            name: measure.name,
            description: measure.description,
          });
        }
      }
    }

    logger.info('Parsed searchable fields from YAML', {
      totalDimensions: parsedYaml.dimensions?.length || 0,
      totalMeasures: parsedYaml.measures?.length || 0,
      searchableCount: searchableFields.length,
    });

    return searchableFields;
  } catch (error) {
    logger.error('Failed to parse YAML content', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}

/**
 * Helper to validate if a field name is valid for database querying
 */
export function isValidFieldName(fieldName: string): boolean {
  // Basic validation to prevent SQL injection
  // Only allow alphanumeric, underscore, and dash
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  return validPattern.test(fieldName);
}
