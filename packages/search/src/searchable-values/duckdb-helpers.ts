/**
 * Type-safe helper functions for DuckDB operations
 * Note: DuckDB types are aliased since the module is lazy-loaded
 */

// Type definitions for lazy-loaded DuckDB module
// These match the actual DuckDB API but avoid direct import
interface DuckDBConnection {
  run(sql: string): Promise<DuckDBResult>;
  closeSync(): void;
}

interface DuckDBResult {
  getRowObjectsJson(): Promise<unknown[]>;
}

import type { DuckDBContext } from './deduplicate';

/**
 * Type guard to check if a connection is open
 */
export function isConnectionOpen(conn: DuckDBConnection | null): conn is DuckDBConnection {
  return conn !== null;
}

/**
 * Type guard to check if a context has an active connection
 */
export function hasActiveConnection(context: DuckDBContext | null): context is DuckDBContext {
  return context !== null && context.conn !== null;
}

/**
 * Execute a function with a guaranteed connection
 * Throws an error if connection is not available
 */
export async function withConnection<T>(
  conn: DuckDBConnection | null,
  fn: (conn: DuckDBConnection) => Promise<T>
): Promise<T> {
  if (!isConnectionOpen(conn)) {
    throw new Error('DuckDB connection not open');
  }
  return fn(conn);
}

/**
 * Execute a function with a guaranteed context
 * Throws an error if context is not available
 */
export async function withContext<T>(
  context: DuckDBContext | null,
  fn: (context: DuckDBContext) => Promise<T>
): Promise<T> {
  if (!hasActiveConnection(context)) {
    throw new Error('DuckDB context not available or connection not open');
  }
  return fn(context);
}

/**
 * Safe cleanup function that handles null connections gracefully
 */
export async function safeCleanup(
  context: DuckDBContext | null,
  cleanupFn: (context: DuckDBContext) => Promise<void>
): Promise<void> {
  if (context) {
    try {
      await cleanupFn(context);
    } catch (error) {
      console.warn('Error during DuckDB cleanup:', error);
    }
  }
}

/**
 * Create a connection with automatic cleanup on error
 */
export async function createConnectionWithCleanup<T>(
  createFn: () => Promise<DuckDBContext>,
  useFn: (context: DuckDBContext) => Promise<T>,
  cleanupFn: (context: DuckDBContext) => Promise<void>
): Promise<T> {
  let context: DuckDBContext | null = null;
  try {
    context = await createFn();
    return await useFn(context);
  } finally {
    if (context) {
      await safeCleanup(context, cleanupFn);
    }
  }
}
