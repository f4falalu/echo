import type { ColumnMetaData, DataMetadata } from '@buster/server-shared/metrics';
import type { FieldMetadata } from '../adapters/base';
import { getGenericSimpleType } from '../adapters/type-mappings';

/**
 * Creates DataMetadata from query results and optional column metadata from adapters
 * @param results - The query result rows
 * @param columns - Optional column metadata from data-source adapters
 * @returns DataMetadata structure with proper type mappings
 */
export function createMetadataFromResults(
  results: Record<string, unknown>[],
  columns?: FieldMetadata[]
): DataMetadata {
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

    // Determine column type based on the first non-null value or adapter metadata
    let columnType: ColumnMetaData['type'] = 'text';
    let simpleType: ColumnMetaData['simple_type'] = 'text';

    // Try to use adapter metadata if available
    const adapterColumn = columns?.find((col) => col.name === columnName);
    if (adapterColumn) {
      // Use the normalized type from the adapter
      const normalizedType = adapterColumn.type.toLowerCase();

      // Use our type mapping utility to determine simple type
      simpleType = getGenericSimpleType(normalizedType);

      // Map to allowed ColumnMetaData types
      switch (normalizedType) {
        case 'integer':
        case 'int':
          columnType = 'int4';
          break;
        case 'bigint':
          columnType = 'int8';
          break;
        case 'smallint':
        case 'tinyint':
          columnType = 'int2';
          break;
        case 'double':
        case 'double precision':
          columnType = 'float8';
          break;
        case 'real':
        case 'float':
          columnType = 'float4';
          break;
        case 'boolean':
        case 'bool':
          columnType = 'bool';
          simpleType = 'text'; // Booleans map to text in simple_type
          break;
        case 'varchar':
        case 'char':
        case 'string':
          columnType = 'text';
          break;
        case 'timestamp':
        case 'datetime':
          columnType = 'timestamp';
          break;
        case 'timestamptz':
          columnType = 'timestamptz';
          break;
        case 'date':
          columnType = 'date';
          break;
        case 'time':
          columnType = 'time';
          break;
        case 'json':
          columnType = 'json';
          break;
        case 'jsonb':
          columnType = 'jsonb';
          break;
        case 'decimal':
        case 'numeric':
          columnType = 'numeric';
          break;
        default:
          // Default to text for unknown types
          columnType = 'text';
          break;
      }
    } else if (values.length > 0) {
      // Fallback: infer from data
      const firstValue = values[0];

      if (typeof firstValue === 'number') {
        columnType = Number.isInteger(firstValue) ? 'int4' : 'float8';
        simpleType = 'number';
      } else if (typeof firstValue === 'boolean') {
        columnType = 'bool';
        simpleType = 'text'; // Map boolean to text since 'boolean' isn't in the enum
      } else if (firstValue instanceof Date) {
        columnType = 'timestamp';
        simpleType = 'date';
      } else if (typeof firstValue === 'string') {
        // Check if it's a numeric string
        if (!Number.isNaN(Number(firstValue))) {
          columnType = Number.isInteger(Number(firstValue)) ? 'int4' : 'float8';
          simpleType = 'number';
        } else if (
          !Number.isNaN(Date.parse(firstValue)) &&
          // Additional check to avoid parsing simple numbers as dates
          (firstValue.includes('-') || firstValue.includes('/') || firstValue.includes(':'))
        ) {
          columnType = 'date';
          simpleType = 'date';
        } else {
          columnType = 'text';
          simpleType = 'text';
        }
      }
    }

    // Calculate min, max, and unique values
    let minValue: string | number = '';
    let maxValue: string | number = '';
    const uniqueValues = new Set(values);

    if (simpleType === 'number' && values.length > 0) {
      // Try to convert values to numbers for proper comparison
      const numericValues = values
        .map((v) => {
          if (typeof v === 'number') return v;
          if (typeof v === 'string' && !Number.isNaN(Number(v))) return Number(v);
          return null;
        })
        .filter((v): v is number => v !== null);

      if (numericValues.length > 0) {
        minValue = Math.min(...numericValues);
        maxValue = Math.max(...numericValues);
      } else {
        // Fallback to string comparison if no valid numbers found
        const sortedValues = [...values].sort();
        minValue = String(sortedValues[0]);
        maxValue = String(sortedValues[sortedValues.length - 1]);
      }
    } else if (simpleType === 'date' && values.length > 0) {
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
      // For text and other types, use string comparison
      const sortedValues = [...values].sort();
      minValue = String(sortedValues[0]);
      maxValue = String(sortedValues[sortedValues.length - 1]);
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
