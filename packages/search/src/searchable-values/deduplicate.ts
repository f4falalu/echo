import { Database } from 'duckdb';
import {
  type DeduplicationInput,
  DeduplicationInputSchema,
  type DeduplicationResult,
  DeduplicationResultSchema,
  type SearchableValue,
} from './types';

/**
 * Custom error for deduplication operations
 */
export class DeduplicationError extends Error {
  constructor(
    message: string,
    public override cause?: unknown
  ) {
    super(message);
    this.name = 'DeduplicationError';
  }
}

/**
 * Creates a hash for a searchable value based on its content
 * Used for efficient deduplication comparison
 */
function createValueHash(value: SearchableValue): string {
  const hashContent = `${value.databaseName}|${value.tableName}|${value.columnName}|${value.value}`;
  return hashContent;
}

/**
 * Deduplicate searchable values using DuckDB for efficient in-memory processing
 * Compares new values against existing values to find what needs to be upserted
 * 
 * @param input - Object containing existing and new searchable values
 * @returns Promise containing deduplication results with values to upsert/skip
 */
export async function deduplicateValues(
  input: DeduplicationInput
): Promise<DeduplicationResult> {
  try {
    // Validate input
    const validInput = DeduplicationInputSchema.parse(input);
    const { existingValues, newValues } = validInput;

    if (newValues.length === 0) {
      return DeduplicationResultSchema.parse({
        toUpsert: [],
        toSkip: [],
        duplicateCount: 0,
      });
    }

    // If no existing values, all new values should be upserted
    if (existingValues.length === 0) {
      return DeduplicationResultSchema.parse({
        toUpsert: newValues,
        toSkip: [],
        duplicateCount: 0,
      });
    }

    return new Promise((resolve, reject) => {
      // Create in-memory DuckDB instance
      const db = new Database(':memory:');

      db.serialize(() => {
        try {
          // Create tables for existing and new values
          db.run(`
            CREATE TABLE existing_values (
              id VARCHAR,
              value_hash VARCHAR,
              database_name VARCHAR,
              table_name VARCHAR,
              column_name VARCHAR,
              schema_name VARCHAR,
              value VARCHAR,
              synced_at TIMESTAMP
            )
          `);

          db.run(`
            CREATE TABLE new_values (
              id VARCHAR,
              value_hash VARCHAR,
              database_name VARCHAR,
              table_name VARCHAR,
              column_name VARCHAR,
              schema_name VARCHAR,
              value VARCHAR,
              synced_at TIMESTAMP,
              embedding VARCHAR
            )
          `);

          // Insert existing values
          const existingStmt = db.prepare(`
            INSERT INTO existing_values (id, value_hash, database_name, table_name, column_name, schema_name, value, synced_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);

          for (const value of existingValues) {
            existingStmt.run([
              value.id,
              createValueHash(value),
              value.databaseName,
              value.tableName,
              value.columnName,
              value.schemaName || null,
              value.value,
              value.syncedAt.toISOString(),
            ]);
          }
          existingStmt.finalize();

          // Insert new values
          const newStmt = db.prepare(`
            INSERT INTO new_values (id, value_hash, database_name, table_name, column_name, schema_name, value, synced_at, embedding)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          for (const value of newValues) {
            newStmt.run([
              value.id,
              createValueHash(value),
              value.databaseName,
              value.tableName,
              value.columnName,
              value.schemaName || null,
              value.value,
              value.syncedAt.toISOString(),
              value.embedding ? JSON.stringify(value.embedding) : null,
            ]);
          }
          newStmt.finalize();

          // Find values that need to be upserted (new or changed)
          db.all(`
            SELECT 
              nv.id,
              nv.value_hash,
              nv.database_name,
              nv.table_name,
              nv.column_name,
              nv.schema_name,
              nv.value,
              nv.synced_at,
              nv.embedding,
              CASE 
                WHEN ev.value_hash IS NULL THEN 'new'
                ELSE 'duplicate'
              END as status
            FROM new_values nv
            LEFT JOIN existing_values ev ON nv.value_hash = ev.value_hash
          `, (err, rows) => {
            if (err) {
              db.close();
              reject(new DeduplicationError('Failed to execute deduplication query', err));
              return;
            }

            try {
              const toUpsert: SearchableValue[] = [];
              const toSkip: SearchableValue[] = [];
              let duplicateCount = 0;

              for (const row of rows as Array<{
                id: string;
                value_hash: string;
                database_name: string;
                table_name: string;
                column_name: string;
                schema_name: string | null;
                value: string;
                synced_at: string;
                embedding: string | null;
                status: 'new' | 'duplicate';
              }>) {
                const searchableValue: SearchableValue = {
                  id: row.id,
                  value: row.value,
                  databaseName: row.database_name,
                  tableName: row.table_name,
                  columnName: row.column_name,
                  schemaName: row.schema_name || undefined,
                  syncedAt: new Date(row.synced_at),
                  embedding: row.embedding ? JSON.parse(row.embedding) : undefined,
                };

                if (row.status === 'new') {
                  toUpsert.push(searchableValue);
                } else {
                  toSkip.push(searchableValue);
                  duplicateCount++;
                }
              }

              db.close();

              const result = DeduplicationResultSchema.parse({
                toUpsert,
                toSkip,
                duplicateCount,
              });

              resolve(result);
            } catch (parseError) {
              db.close();
              reject(new DeduplicationError('Failed to parse deduplication results', parseError));
            }
          });
        } catch (setupError) {
          db.close();
          reject(new DeduplicationError('Failed to setup deduplication database', setupError));
        }
      });
    });
  } catch (error) {
    if (error instanceof DeduplicationError) {
      throw error;
    }
    throw new DeduplicationError(
      `Failed to deduplicate values: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error
    );
  }
}

/**
 * Simple hash-based deduplication for smaller datasets
 * Alternative to DuckDB approach when memory usage is less of a concern
 * 
 * @param input - Object containing existing and new searchable values
 * @returns Promise containing deduplication results
 */
export async function deduplicateValuesSimple(
  input: DeduplicationInput
): Promise<DeduplicationResult> {
  try {
    const validInput = DeduplicationInputSchema.parse(input);
    const { existingValues, newValues } = validInput;

    if (newValues.length === 0) {
      return DeduplicationResultSchema.parse({
        toUpsert: [],
        toSkip: [],
        duplicateCount: 0,
      });
    }

    // Create a Set of existing value hashes for O(1) lookup
    const existingHashes = new Set(
      existingValues.map((value) => createValueHash(value))
    );

    const toUpsert: SearchableValue[] = [];
    const toSkip: SearchableValue[] = [];
    let duplicateCount = 0;

    // Check each new value against existing hashes
    for (const newValue of newValues) {
      const newHash = createValueHash(newValue);
      
      if (existingHashes.has(newHash)) {
        toSkip.push(newValue);
        duplicateCount++;
      } else {
        toUpsert.push(newValue);
      }
    }

    return DeduplicationResultSchema.parse({
      toUpsert,
      toSkip,
      duplicateCount,
    });
  } catch (error) {
    throw new DeduplicationError(
      `Failed to deduplicate values (simple): ${error instanceof Error ? error.message : 'Unknown error'}`,
      error
    );
  }
}