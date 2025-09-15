# Data Source Package

This package provides secure, isolated connections to customer data sources. It handles all external database connections with a security-first approach.

## Core Responsibility

`@buster/data-source` is responsible for:
- Connecting to customer databases (PostgreSQL, MySQL, BigQuery, Snowflake, etc.)
- Data source introspection and schema discovery
- Secure query execution
- Connection pooling and management
- Query result transformation

## Security Principles

🔒 **SECURITY IS PARAMOUNT** 🔒

This package handles sensitive customer data and MUST:
- Never log credentials or sensitive data
- Always use encrypted connections
- Implement query timeouts and resource limits
- Validate and sanitize all inputs
- Use read-only connections where possible
- Implement proper connection pooling
- Handle credentials securely (never in code)

## Architecture

```
Apps → @buster/data-source → Customer Databases
            ↓
        Adapters
    (DB-specific logic)
```

## Adapter Pattern

Each data source type has its own adapter:

```
data-source/
├── src/
│   ├── adapters/
│   │   ├── postgresql/
│   │   │   ├── connection.ts
│   │   │   ├── introspection.ts
│   │   │   ├── query-executor.ts
│   │   │   └── index.ts
│   │   ├── mysql/
│   │   ├── snowflake/
│   │   ├── bigquery/
│   │   └── redshift/
│   ├── types/
│   │   ├── connection.ts
│   │   ├── introspection.ts
│   │   └── query.ts
│   └── index.ts
```

## Connection Management

### Secure Connection Pattern

```typescript
import { z } from 'zod';
import { encrypt, decrypt } from '../security';

// Connection config schema with validation
const PostgreSQLConfigSchema = z.object({
  host: z.string().describe('Database host'),
  port: z.number().min(1).max(65535).describe('Database port'),
  database: z.string().describe('Database name'),
  username: z.string().describe('Database username'),
  password: z.string().describe('Encrypted password'),
  ssl: z.boolean().default(true).describe('Use SSL connection'),
  connectionTimeout: z.number().default(30000).describe('Connection timeout in ms'),
  queryTimeout: z.number().default(60000).describe('Query timeout in ms'),
  maxConnections: z.number().default(10).describe('Max connection pool size')
});

type PostgreSQLConfig = z.infer<typeof PostgreSQLConfigSchema>;

export async function createConnection(config: PostgreSQLConfig) {
  const validated = PostgreSQLConfigSchema.parse(config);
  
  // Decrypt password only when needed
  const decryptedPassword = await decrypt(validated.password);
  
  // Create connection with security settings
  const connection = await createPool({
    host: validated.host,
    port: validated.port,
    database: validated.database,
    user: validated.username,
    password: decryptedPassword,
    ssl: validated.ssl ? { rejectUnauthorized: true } : false,
    connectionTimeoutMillis: validated.connectionTimeout,
    query_timeout: validated.queryTimeout,
    max: validated.maxConnections,
    // Security: Use read-only transaction by default
    options: '-c default_transaction_read_only=on'
  });
  
  // Clear decrypted password from memory
  decryptedPassword.fill(0);
  
  return connection;
}
```

### Connection Pool Management

```typescript
const connectionPools = new Map<string, ConnectionPool>();

export async function getConnection(dataSourceId: string) {
  if (!connectionPools.has(dataSourceId)) {
    const config = await getDataSourceConfig(dataSourceId);
    const pool = await createConnection(config);
    connectionPools.set(dataSourceId, pool);
  }
  
  return connectionPools.get(dataSourceId)!;
}

export async function closeConnection(dataSourceId: string) {
  const pool = connectionPools.get(dataSourceId);
  if (pool) {
    await pool.end();
    connectionPools.delete(dataSourceId);
  }
}
```

## Query Execution

### Safe Query Execution

```typescript
export async function executeQuery(params: ExecuteQueryParams) {
  const validated = ExecuteQueryParamsSchema.parse(params);
  
  // Get connection from pool
  const connection = await getConnection(validated.dataSourceId);
  
  try {
    // Set query timeout
    const client = await connection.connect();
    await client.query(`SET statement_timeout = ${validated.timeout}`);
    
    // Execute with row limit
    const query = addRowLimit(validated.query, validated.maxRows);
    const result = await client.query(query);
    
    // Transform and sanitize results
    return transformResults(result.rows, validated.maxRows);
  } catch (error) {
    // Never expose internal errors to users
    throw new QueryExecutionError('Query execution failed', {
      dataSourceId: validated.dataSourceId,
      // Don't include sensitive query details
    });
  } finally {
    client.release();
  }
}

function addRowLimit(query: string, maxRows: number): string {
  // Add LIMIT clause if not present
  if (!query.toLowerCase().includes('limit')) {
    return `${query} LIMIT ${maxRows}`;
  }
  return query;
}
```

## Introspection

### Schema Discovery

```typescript
export async function introspectDatabase(dataSourceId: string) {
  const connection = await getConnection(dataSourceId);
  
  // Get tables
  const tables = await connection.query(`
    SELECT 
      table_schema,
      table_name,
      table_type
    FROM information_schema.tables
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema, table_name
  `);
  
  // Get columns for each table
  const columns = await connection.query(`
    SELECT 
      table_schema,
      table_name,
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    ORDER BY table_schema, table_name, ordinal_position
  `);
  
  return transformIntrospectionResults(tables.rows, columns.rows);
}
```

## Adapter Implementation

### Base Adapter Interface

```typescript
export interface DataSourceAdapter {
  connect(config: unknown): Promise<void>;
  disconnect(): Promise<void>;
  executeQuery(query: string, params?: unknown[]): Promise<QueryResult>;
  introspect(): Promise<IntrospectionResult>;
  testConnection(): Promise<boolean>;
}
```

### Snowflake Adapter Example

```typescript
import snowflake from 'snowflake-sdk';

export class SnowflakeAdapter implements DataSourceAdapter {
  private connection: snowflake.Connection | null = null;
  
  async connect(config: SnowflakeConfig) {
    const validated = SnowflakeConfigSchema.parse(config);
    
    this.connection = snowflake.createConnection({
      account: validated.account,
      username: validated.username,
      password: await decrypt(validated.password),
      warehouse: validated.warehouse,
      database: validated.database,
      schema: validated.schema,
      role: validated.role,
      timeout: validated.timeout
    });
    
    await promisify(this.connection.connect.bind(this.connection))();
  }
  
  async executeQuery(query: string, params?: unknown[]) {
    if (!this.connection) {
      throw new Error('Not connected');
    }
    
    // Snowflake-specific query execution
    const statement = this.connection.execute({
      sqlText: query,
      binds: params,
      complete: (err, stmt, rows) => {
        if (err) throw new SecureQueryError('Query failed');
        return rows;
      }
    });
    
    return transformSnowflakeResults(statement);
  }
}
```

## Error Handling

### Secure Error Messages

```typescript
export class DataSourceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly dataSourceId?: string
  ) {
    // Never include sensitive information in error messages
    super(message);
    this.name = 'DataSourceError';
  }
}

export function handleDataSourceError(error: unknown): never {
  // Log full error internally
  console.error('Data source error:', error);
  
  // Return sanitized error to user
  if (error instanceof DataSourceError) {
    throw error;
  }
  
  // Generic error for unknown issues
  throw new DataSourceError(
    'Failed to execute query',
    'QUERY_EXECUTION_FAILED'
  );
}
```

## Testing Patterns

### Unit Tests

```typescript
describe('PostgreSQLAdapter', () => {
  it('should validate connection config', () => {
    const invalidConfig = {
      host: 'localhost',
      port: 'not-a-number', // Invalid
      database: 'test'
    };
    
    expect(() => {
      PostgreSQLConfigSchema.parse(invalidConfig);
    }).toThrow();
  });
  
  it('should enforce query timeout', async () => {
    const adapter = new PostgreSQLAdapter();
    await adapter.connect(mockConfig);
    
    const longQuery = 'SELECT pg_sleep(10)';
    await expect(
      adapter.executeQuery(longQuery, { timeout: 1000 })
    ).rejects.toThrow('Query timeout');
  });
});
```

### Integration Tests

```typescript
describe('data-source.int.test.ts', () => {
  it('should connect to real database', async () => {
    const adapter = new PostgreSQLAdapter();
    await adapter.connect(testConfig);
    
    const result = await adapter.testConnection();
    expect(result).toBe(true);
    
    await adapter.disconnect();
  });
});
```

## Best Practices

### DO:
- Always use encrypted connections
- Implement connection pooling
- Set query and connection timeouts
- Limit result set sizes
- Validate all inputs with Zod
- Use read-only connections when possible
- Clear sensitive data from memory
- Log errors internally, sanitize for users

### DON'T:
- Log credentials or query results
- Expose internal error details
- Allow unlimited result sets
- Trust user input without validation
- Keep connections open indefinitely
- Store passwords in plain text
- Expose connection details in errors

## Performance Optimization

### Query Caching

```typescript
const queryCache = new Map<string, CachedResult>();

export async function executeQueryWithCache(
  query: string,
  dataSourceId: string,
  ttl: number = 60000
) {
  const cacheKey = `${dataSourceId}:${query}`;
  const cached = queryCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.result;
  }
  
  const result = await executeQuery({ query, dataSourceId });
  queryCache.set(cacheKey, {
    result,
    timestamp: Date.now()
  });
  
  return result;
}
```

### Batch Operations

```typescript
export async function executeBatch(
  queries: string[],
  dataSourceId: string
) {
  const connection = await getConnection(dataSourceId);
  const client = await connection.connect();
  
  try {
    await client.query('BEGIN');
    
    const results = [];
    for (const query of queries) {
      const result = await client.query(query);
      results.push(result.rows);
    }
    
    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

This package is critical for customer data security. Always prioritize security over performance or convenience.