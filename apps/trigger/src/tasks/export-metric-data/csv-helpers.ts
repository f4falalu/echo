import type { FieldMetadata } from '@buster/data-source';

/**
 * Escapes a value for CSV format
 * Handles commas, quotes, and newlines properly
 */
export function escapeCSV(value: unknown): string {
  if (value == null) return '';

  const str = String(value);

  // Check if escaping is needed
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    // Escape quotes by doubling them and wrap in quotes
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Converts database query results to CSV format
 * @param rows - Array of row objects from database
 * @param fields - Field metadata for column information
 * @returns CSV string with headers and data
 */
export function convertToCSV(rows: Record<string, unknown>[], fields: FieldMetadata[]): string {
  // Handle empty result set
  if (rows.length === 0) {
    // Return just headers for empty results
    const headers = fields.map((f) => escapeCSV(f.name));
    return headers.join(',');
  }

  // Get column names from field metadata
  const columnNames = fields.map((f) => f.name);

  // Build CSV lines
  const csvLines: string[] = [];

  // Add header row
  csvLines.push(columnNames.map(escapeCSV).join(','));

  // Add data rows
  for (const row of rows) {
    const values = columnNames.map((col) => {
      const value = row[col];

      // Special handling for different data types
      if (value instanceof Date) {
        return escapeCSV(value.toISOString());
      }

      if (typeof value === 'object' && value !== null) {
        // Convert objects/arrays to JSON string
        return escapeCSV(JSON.stringify(value));
      }

      return escapeCSV(value);
    });

    csvLines.push(values.join(','));
  }

  return csvLines.join('\n');
}

/**
 * Estimates the size of a CSV file from row data
 * Useful for pre-checking if data will be too large
 */
export function estimateCSVSize(rows: Record<string, unknown>[], fields: FieldMetadata[]): number {
  if (rows.length === 0) {
    return fields.map((f) => f.name).join(',').length;
  }

  // Sample first 100 rows to estimate average row size
  const sampleSize = Math.min(100, rows.length);
  let totalSize = 0;

  // Header size
  totalSize += fields.map((f) => f.name).join(',').length + 1; // +1 for newline

  // Calculate average row size from sample
  for (let i = 0; i < sampleSize; i++) {
    const row = rows[i];
    if (!row) continue;
    const rowStr = fields.map((f) => String(row[f.name] ?? '')).join(',');
    totalSize += rowStr.length + 1; // +1 for newline
  }

  // Estimate total size
  const avgRowSize = totalSize / (sampleSize + 1); // +1 for header
  return Math.ceil(avgRowSize * (rows.length + 1));
}
