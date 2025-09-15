# Data Source Package

Secure, isolated connections to customer data sources. This package handles all external database connections with a security-first approach.

## Installation

```bash
pnpm add @buster/data-source
```

## Overview

`@buster/data-source` provides:
- Secure connections to customer databases (PostgreSQL, MySQL, BigQuery, Snowflake, etc.)
- Data source introspection and schema discovery
- Secure query execution with timeouts and limits
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

## Supported Data Sources

- **PostgreSQL** - Full introspection and query support
- **MySQL** - Full introspection and query support
- **Snowflake** - Full support with clustering information
- **BigQuery** - Google Cloud data warehouse
- **Redshift** - AWS data warehouse
- **SQL Server** - Microsoft SQL Server
- **Databricks** - Unified analytics platform

## Usage

### Creating a Connection

```typescript
import { createConnection } from '@buster/data-source';

const connection = await createConnection({
  type: 'postgresql',
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  username: 'user',
  password: encryptedPassword, // Always encrypted
  ssl: true,
  connectionTimeout: 30000,
  queryTimeout: 60000,
  maxConnections: 10
});
```

### Executing Queries

```typescript
import { executeQuery } from '@buster/data-source';

const result = await executeQuery({
  dataSourceId: 'source-123',
  query: 'SELECT * FROM users',
  maxRows: 1000,
  timeout: 60000
});

// Result is automatically limited and sanitized
console.info(`Retrieved ${result.rowCount} rows`);
```

### Database Introspection

```typescript
import { introspectDatabase } from '@buster/data-source';

const schema = await introspectDatabase('source-123');

// Get table and column information
schema.tables.forEach(table => {
  console.info(`Table: ${table.name}`);
  table.columns.forEach(column => {
    console.info(`  - ${column.name}: ${column.type}`);
  });
});
```

## Adapter Pattern

Each data source type has its own adapter:

```typescript
export interface DataSourceAdapter {
  connect(config: unknown): Promise<void>;
  disconnect(): Promise<void>;
  executeQuery(query: string, params?: unknown[]): Promise<QueryResult>;
  introspect(): Promise<IntrospectionResult>;
  testConnection(): Promise<boolean>;
}
```

### PostgreSQL Adapter Example

```typescript
import { PostgreSQLAdapter } from '@buster/data-source';

const adapter = new PostgreSQLAdapter();
await adapter.connect({
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  username: 'user',
  password: encryptedPassword,
  ssl: true
});

const result = await adapter.executeQuery('SELECT NOW()');
```

## Security Features

### Connection Security

```typescript
// All connections use SSL by default
const connection = await createConnection({
  type: 'postgresql',
  ssl: true, // Default
  // SSL options
  ssl: {
    rejectUnauthorized: true,
    ca: certificateAuthority,
    cert: clientCertificate,
    key: clientKey
  }
});
```

### Query Limits

```typescript
// Automatic row limiting
const result = await executeQuery({
  query: 'SELECT * FROM large_table',
  maxRows: 1000 // Enforced limit
});

// Query timeout
const result = await executeQuery({
  query: 'SELECT * FROM slow_query',
  timeout: 30000 // 30 second timeout
});
```

### Read-Only Connections

```typescript
// Use read-only connections for safety
const connection = await createConnection({
  type: 'postgresql',
  readOnly: true, // Sets transaction to read-only
  options: '-c default_transaction_read_only=on'
});
```

## Error Handling

```typescript
import { DataSourceError } from '@buster/data-source';

try {
  await executeQuery({
    dataSourceId: 'source-123',
    query: 'SELECT * FROM users'
  });
} catch (error) {
  if (error instanceof DataSourceError) {
    // Handle known errors
    console.error(`Query failed: ${error.message}`);
    // error.code contains error code
    // No sensitive information exposed
  } else {
    // Unknown error
    console.error('Unexpected error occurred');
  }
}
```

## Connection Pooling

```typescript
// Connections are automatically pooled
const pool = await createConnectionPool({
  type: 'postgresql',
  min: 2,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Use connection from pool
const result = await pool.query('SELECT * FROM users');
```

## Testing

### Unit Tests

```typescript
describe('PostgreSQLAdapter', () => {
  it('should validate connection config', () => {
    const invalidConfig = {
      host: 'localhost',
      port: 'not-a-number' // Invalid
    };
    
    expect(() => {
      PostgreSQLConfigSchema.parse(invalidConfig);
    }).toThrow();
  });
  
  it('should enforce query timeout', async () => {
    const adapter = new PostgreSQLAdapter();
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
  it('should connect to database', async () => {
    const connection = await createConnection(testConfig);
    const result = await connection.testConnection();
    expect(result).toBe(true);
    await connection.disconnect();
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

## Development

```bash
# Build
turbo build --filter=@buster/data-source

# Test
turbo test:unit --filter=@buster/data-source
turbo test:integration --filter=@buster/data-source

# Lint
turbo lint --filter=@buster/data-source
```

This package is critical for customer data security. Always prioritize security over performance or convenience.