import snowflake from 'snowflake-sdk';
import { TIMEOUT_CONFIG } from '../config/timeouts';
import { QueryTimeoutError, classifyError } from '../errors/data-source-errors';
import type { DataSourceIntrospector } from '../introspection/base';
import { SnowflakeIntrospector } from '../introspection/snowflake';
import { type Credentials, DataSourceType, type SnowflakeCredentials } from '../types/credentials';
import type { QueryParameter } from '../types/query';
import { type AdapterQueryResult, BaseAdapter, type FieldMetadata } from './base';

// Use Snowflake SDK types directly
type SnowflakeError = snowflake.SnowflakeError;

interface SnowflakeStatement {
  getColumns?: () => Array<{
    getName(): string;
    getType(): string;
    isNullable(): boolean;
    getScale(): number;
    getPrecision(): number;
  }>;
}

// Configure Snowflake SDK to disable logging
snowflake.configure({
  logLevel: 'OFF',
  additionalLogToConsole: false,
});

// Warm connection for reuse in serverless environments
let warmConnection: snowflake.Connection | null = null;
let warmConnectionCredentials: string | null = null;
let warmConnectionLastUsed = 0;
const CONNECTION_REUSE_TIME = 5 * 60 * 1000; // 5 minutes

/**
 * Snowflake database adapter optimized for serverless environments
 */
export class SnowflakeAdapter extends BaseAdapter {
  private connection?: snowflake.Connection | undefined;
  private credentialKey?: string | undefined;
  private introspector?: SnowflakeIntrospector;
  private lastActivity = 0;

  async initialize(credentials: Credentials): Promise<void> {
    this.validateCredentials(credentials, DataSourceType.Snowflake);
    const snowflakeCredentials = credentials as SnowflakeCredentials;

    try {
      // Create a unique key for this credential set
      this.credentialKey = `${snowflakeCredentials.account_id}-${snowflakeCredentials.username}-${snowflakeCredentials.warehouse_id}-${snowflakeCredentials.default_database}`;

      // Check if we can reuse a warm connection
      const now = Date.now();
      if (
        warmConnection &&
        warmConnectionCredentials === this.credentialKey &&
        now - warmConnectionLastUsed < CONNECTION_REUSE_TIME
      ) {
        // Test if connection is still healthy
        const isHealthy = await this.testWarmConnection(warmConnection);
        if (isHealthy) {
          this.connection = warmConnection;
          this.credentials = credentials;
          this.connected = true;
          this.lastActivity = now;
          warmConnectionLastUsed = now;
          console.info('Reusing warm Snowflake connection');
          return;
        }
        // Connection is stale, destroy it
        await this.destroyConnection(warmConnection);
        warmConnection = null;
        warmConnectionCredentials = null;
      }

      // Create new connection
      this.connection = await this.createConnection(snowflakeCredentials);

      // Store as warm connection for next invocation
      warmConnection = this.connection;
      warmConnectionCredentials = this.credentialKey;
      warmConnectionLastUsed = now;

      this.credentials = credentials;
      this.connected = true;
      this.lastActivity = now;
    } catch (error) {
      throw classifyError(error);
    }
  }

  private async createConnection(credentials: SnowflakeCredentials): Promise<snowflake.Connection> {
    const connectionOptions: snowflake.ConnectionOptions = {
      account: credentials.account_id,
      username: credentials.username,
      password: credentials.password,
      warehouse: credentials.warehouse_id,
      database: credentials.default_database,
    };

    if (credentials.role) {
      connectionOptions.role = credentials.role;
    }

    if (credentials.default_schema) {
      connectionOptions.schema = credentials.default_schema;
    }

    const connection = snowflake.createConnection(connectionOptions);

    // Connect with timeout
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Connection timeout after ${TIMEOUT_CONFIG.connection.acquisition}ms`));
      }, TIMEOUT_CONFIG.connection.acquisition);

      connection.connect((err) => {
        clearTimeout(timeout);
        if (err) {
          reject(new Error(`Failed to connect to Snowflake: ${err.message}`));
        } else {
          resolve(connection);
        }
      });
    });
  }

  private async testWarmConnection(connection: snowflake.Connection): Promise<boolean> {
    try {
      return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(false), TIMEOUT_CONFIG.connection.health);

        connection.execute({
          sqlText: 'SELECT 1',
          complete: (err: SnowflakeError | undefined) => {
            clearTimeout(timeout);
            resolve(!err);
          },
        });
      });
    } catch {
      return false;
    }
  }

  private async destroyConnection(connection: snowflake.Connection): Promise<void> {
    return new Promise((resolve) => {
      connection.destroy((err: SnowflakeError | undefined) => {
        if (err) {
          console.error('Error destroying connection:', err);
        }
        resolve();
      });
    });
  }

  async query(
    sql: string,
    params?: QueryParameter[],
    maxRows?: number,
    timeout?: number
  ): Promise<AdapterQueryResult> {
    this.ensureConnected();

    if (!this.connection) {
      throw new Error('Snowflake connection not initialized');
    }

    // Update activity timestamp
    this.lastActivity = Date.now();

    // Helper function to add timeout to any query promise
    const executeWithTimeout = async <T>(
      queryPromise: Promise<T>,
      timeoutMs: number
    ): Promise<T> => {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new QueryTimeoutError(timeoutMs, sql));
        }, timeoutMs);
      });

      return Promise.race([queryPromise, timeoutPromise]);
    };

    const connection = this.connection;

    try {
      // Set query timeout if specified (default: 120 seconds for Snowflake queue handling)
      const timeoutMs = timeout || TIMEOUT_CONFIG.query.default;

      // For maxRows, we'll fetch maxRows + 1 to determine if there are more rows
      let effectiveSql = sql;
      if (maxRows && maxRows > 0) {
        // Check if query already has LIMIT
        const upperSql = sql.toUpperCase();
        if (!upperSql.includes(' LIMIT ')) {
          effectiveSql = `${sql} LIMIT ${maxRows + 1}`;
        }
      }

      const queryPromise = new Promise<{
        rows: Record<string, unknown>[];
        statement: SnowflakeStatement;
      }>((resolve, reject) => {
        if (!connection) {
          reject(new Error('Failed to acquire Snowflake connection'));
          return;
        }
        connection.execute({
          sqlText: effectiveSql,
          binds: params as snowflake.Binds,
          complete: (
            err: SnowflakeError | undefined,
            stmt: SnowflakeStatement,
            rows: Record<string, unknown>[] | undefined
          ) => {
            if (err) {
              reject(new Error(`Snowflake query failed: ${err.message}`));
            } else {
              resolve({ rows: rows || [], statement: stmt });
            }
          },
        });
      });

      const result = await executeWithTimeout(queryPromise, timeoutMs);

      const fields: FieldMetadata[] =
        result.statement?.getColumns?.()?.map((col) => ({
          name: col.getName(),
          type: col.getType(),
          nullable: col.isNullable(),
          scale: col.getScale() > 0 ? col.getScale() : 0,
          precision: col.getPrecision() > 0 ? col.getPrecision() : 0,
        })) || [];

      // Handle maxRows logic
      let finalRows = result.rows;
      let hasMoreRows = false;

      if (maxRows && maxRows > 0 && result.rows.length > maxRows) {
        finalRows = result.rows.slice(0, maxRows);
        hasMoreRows = true;
      }

      const queryResult = {
        rows: finalRows,
        rowCount: finalRows.length,
        fields,
        hasMoreRows,
      };

      return queryResult;
    } catch (error) {
      // Use the error classification system
      throw classifyError(error, { sql, timeout: timeout || TIMEOUT_CONFIG.query.default });
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.connection) {
      return false;
    }

    try {
      // Test connection by running a simple query
      const isHealthy = await this.testWarmConnection(this.connection);

      // Update activity timestamp on successful test
      if (isHealthy) {
        this.lastActivity = Date.now();
      }

      return isHealthy;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    // In serverless, we keep the connection warm for reuse
    // Only mark this adapter as disconnected
    this.connected = false;

    // Don't destroy the warm connection if it's still recent
    if (
      this.connection &&
      this.connection === warmConnection &&
      Date.now() - this.lastActivity < CONNECTION_REUSE_TIME
    ) {
      console.info('Keeping Snowflake connection warm for reuse');
    } else if (this.connection) {
      // Connection is too old or not the warm connection, destroy it
      await this.destroyConnection(this.connection);
      if (this.connection === warmConnection) {
        warmConnection = null;
        warmConnectionCredentials = null;
      }
    }

    this.connection = undefined;
    this.credentialKey = undefined;
  }

  getDataSourceType(): string {
    return DataSourceType.Snowflake;
  }

  introspect(): DataSourceIntrospector {
    if (!this.introspector) {
      this.introspector = new SnowflakeIntrospector('snowflake', this);
    }
    return this.introspector;
  }

  /**
   * Get connection statistics for monitoring
   */
  getConnectionStats() {
    return {
      connected: this.connected,
      credentialKey: this.credentialKey,
      lastActivity: this.lastActivity,
      isWarmConnection: this.connection === warmConnection,
    };
  }

  /**
   * Static method to cleanup warm connections
   * Should be called on application shutdown
   */
  static async cleanup(): Promise<void> {
    // Destroy warm connection if it exists
    if (warmConnection) {
      try {
        await new Promise<void>((resolve) => {
          warmConnection?.destroy((err: SnowflakeError | undefined) => {
            if (err) {
              console.error('Error destroying warm connection:', err);
            }
            resolve();
          });
        });
      } catch (error) {
        console.error('Failed to destroy warm connection:', error);
      }
      warmConnection = null;
      warmConnectionCredentials = null;
    }
  }
}
