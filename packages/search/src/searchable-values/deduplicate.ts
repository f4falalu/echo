/**
 * DuckDB-based deduplication for searchable values
 * Uses functional composition and Zod validation
 */

import * as duckdb from 'duckdb';
import { z } from 'zod';
import {
  type DeduplicationResult,
  DeduplicationResultSchema,
  type SearchableValue,
  SearchableValueSchema,
  createUniqueKey,
} from './types';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const DeduplicateInputSchema = z.object({
  existingKeys: z.array(z.string()),
  newValues: z.array(SearchableValueSchema),
});

// ============================================================================
// PURE UTILITY FUNCTIONS
// ============================================================================

/**
 * Batch array into chunks for processing
 */
export const batchArray = <T>(array: T[], batchSize: number): T[][] => {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
};

/**
 * Create SQL-safe string by escaping single quotes
 */
export const escapeSqlString = (str: string): string => {
  return str.replace(/'/g, "''");
};

/**
 * Format values for SQL IN clause
 */
export const formatSqlInClause = (values: string[]): string => {
  if (values.length === 0) return "('')"; // Empty set
  return values.map((v) => `'${escapeSqlString(v)}'`).join(',');
};

// ============================================================================
// DUCKDB CONNECTION MANAGEMENT
// ============================================================================

export interface DuckDBConnection {
  db: duckdb.Database;
  conn: duckdb.Connection;
}

/**
 * Create an in-memory DuckDB connection
 */
export const createConnection = (): Promise<DuckDBConnection> => {
  return new Promise((resolve, reject) => {
    const db = new duckdb.Database(':memory:', (err) => {
      if (err) {
        reject(new Error(`Failed to create DuckDB database: ${err.message}`));
        return;
      }

      const conn = db.connect();
      resolve({ db, conn });
    });
  });
};

/**
 * Close DuckDB connection and database
 */
export const closeConnection = (connection: DuckDBConnection): Promise<void> => {
  return new Promise((resolve) => {
    connection.conn.close(() => {
      connection.db.close(() => {
        resolve();
      });
    });
  });
};

/**
 * Execute a SQL query and return results
 */
export const executeQuery = <T = unknown>(conn: duckdb.Connection, sql: string): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    conn.all(sql, (err, result) => {
      if (err) {
        reject(new Error(`DuckDB query failed: ${err.message}\nSQL: ${sql}`));
      } else {
        resolve((result as T[]) || []);
      }
    });
  });
};

// ============================================================================
// DEDUPLICATION OPERATIONS
// ============================================================================

/**
 * Create and populate temporary tables for deduplication
 */
const setupTables = async (
  conn: duckdb.Connection,
  existingKeys: string[],
  newKeys: string[]
): Promise<void> => {
  // Create tables
  await executeQuery(
    conn,
    `
    CREATE TABLE existing_keys (key VARCHAR PRIMARY KEY)
  `
  );

  await executeQuery(
    conn,
    `
    CREATE TABLE new_keys (key VARCHAR PRIMARY KEY)
  `
  );

  // Insert existing keys in batches
  if (existingKeys.length > 0) {
    const batches = batchArray(existingKeys, 1000);
    for (const batch of batches) {
      const values = batch.map((key) => `('${escapeSqlString(key)}')`).join(',');
      await executeQuery(conn, `INSERT INTO existing_keys VALUES ${values}`);
    }
  }

  // Insert new keys in batches
  if (newKeys.length > 0) {
    const batches = batchArray(newKeys, 1000);
    for (const batch of batches) {
      const values = batch.map((key) => `('${escapeSqlString(key)}')`).join(',');
      await executeQuery(conn, `INSERT INTO new_keys VALUES ${values}`);
    }
  }
};

/**
 * Find keys that exist only in new_keys table
 */
const findUniqueNewKeys = async (conn: duckdb.Connection): Promise<string[]> => {
  const result = await executeQuery<{ key: string }>(
    conn,
    `
    SELECT key FROM new_keys 
    WHERE key NOT IN (SELECT key FROM existing_keys)
    ORDER BY key
  `
  );

  return result.map((row) => row.key);
};

/**
 * Core deduplication logic using DuckDB
 */
const performDeduplication = async (
  existingKeys: string[],
  newValues: SearchableValue[]
): Promise<{ uniqueValues: SearchableValue[]; duplicateCount: number }> => {
  // Early return for empty inputs
  if (newValues.length === 0) {
    return { uniqueValues: [], duplicateCount: 0 };
  }

  // Create key map for quick lookups
  const valuesByKey = new Map<string, SearchableValue>();
  const newKeys: string[] = [];

  for (const value of newValues) {
    const key = createUniqueKey(value);
    valuesByKey.set(key, value);
    newKeys.push(key);
  }

  // If no existing keys, all new values are unique
  if (existingKeys.length === 0) {
    return { uniqueValues: newValues, duplicateCount: 0 };
  }

  let connection: DuckDBConnection | null = null;

  try {
    // Create DuckDB connection
    connection = await createConnection();

    // Setup tables and insert data
    await setupTables(connection.conn, existingKeys, newKeys);

    // Find unique keys
    const uniqueKeys = await findUniqueNewKeys(connection.conn);

    // Map unique keys back to values
    const uniqueValues = uniqueKeys
      .map((key) => valuesByKey.get(key))
      .filter((value): value is SearchableValue => value !== undefined);

    const duplicateCount = newValues.length - uniqueValues.length;

    return { uniqueValues, duplicateCount };
  } finally {
    // Always clean up connection
    if (connection) {
      await closeConnection(connection);
    }
  }
};

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Deduplicate searchable values against existing keys
 * Returns only values that don't already exist
 */
export const deduplicateValues = async (
  input: z.infer<typeof DeduplicateInputSchema>
): Promise<DeduplicationResult> => {
  // Validate input
  const validated = DeduplicateInputSchema.parse(input);

  // Perform deduplication
  const startTime = Date.now();
  const { uniqueValues, duplicateCount } = await performDeduplication(
    validated.existingKeys,
    validated.newValues
  );

  const processingTime = Date.now() - startTime;

  // Log performance metrics for large datasets
  if (validated.newValues.length > 1000) {
    console.info(
      `Deduplication completed: ${uniqueValues.length} new, ${duplicateCount} duplicates, ${processingTime}ms`
    );
  }

  // Return validated result
  return DeduplicationResultSchema.parse({
    newValues: uniqueValues,
    existingCount: validated.existingKeys.length,
    newCount: uniqueValues.length,
  });
};

/**
 * Check if specific values already exist
 * Useful for single value checks without full deduplication
 */
export const checkExistence = async (
  existingKeys: string[],
  valuesToCheck: SearchableValue[]
): Promise<Map<string, boolean>> => {
  const result = new Map<string, boolean>();

  if (valuesToCheck.length === 0 || existingKeys.length === 0) {
    // If no existing keys, nothing exists
    for (const value of valuesToCheck) {
      result.set(createUniqueKey(value), false);
    }
    return result;
  }

  // Use DuckDB for efficient set membership testing
  const { uniqueValues } = await performDeduplication(existingKeys, valuesToCheck);
  const uniqueKeys = new Set(uniqueValues.map(createUniqueKey));

  for (const value of valuesToCheck) {
    const key = createUniqueKey(value);
    result.set(key, !uniqueKeys.has(key));
  }

  return result;
};

/**
 * Get statistics about deduplication without returning values
 * Useful for dry-run or monitoring
 */
export const getDeduplicationStats = async (
  existingKeys: string[],
  newValues: SearchableValue[]
): Promise<{ total: number; unique: number; duplicate: number; percentage: number }> => {
  const { uniqueValues } = await performDeduplication(existingKeys, newValues);

  const total = newValues.length;
  const unique = uniqueValues.length;
  const duplicate = total - unique;
  const percentage = total > 0 ? (duplicate / total) * 100 : 0;

  return {
    total,
    unique,
    duplicate,
    percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
  };
};
