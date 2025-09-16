import { describe, it, expect } from 'vitest';
import {
  extractPhysicalTables,
  extractColumnReferences,
  tablesMatch,
  checkQueryIsReadOnly,
  validateWildcardUsage,
  extractTablesFromYml,
  extractDatasetsFromYml,
} from './parser-helpers';

describe('extractPhysicalTables', () => {
  it('should handle BigQuery queries with backtick-quoted project names', () => {
    const sql = "SELECT COUNT(DISTINCT u.user_id) as total_users FROM `buster-381916`.analytics.user u";
    const tables = extractPhysicalTables(sql, 'bigquery');
    
    expect(tables).toHaveLength(1);
    expect(tables[0]).toMatchObject({
      database: 'buster-381916',
      schema: 'analytics',
      table: 'user',
      fullName: 'buster-381916.analytics.user'
    });
  });

  it('should handle standard BigQuery queries without backticks', () => {
    const sql = 'SELECT * FROM project.dataset.table';
    const tables = extractPhysicalTables(sql, 'bigquery');
    
    expect(tables).toHaveLength(1);
    expect(tables[0]).toMatchObject({
      database: 'project',
      schema: 'dataset',
      table: 'table',
      fullName: 'project.dataset.table'
    });
  });

  it('should handle PostgreSQL queries', () => {
    const sql = 'SELECT * FROM public.users';
    const tables = extractPhysicalTables(sql, 'postgresql');
    
    expect(tables).toHaveLength(1);
    expect(tables[0]).toMatchObject({
      schema: 'public',
      table: 'users',
      fullName: 'public.users'
    });
  });

  it('should handle Snowflake queries with quoted identifiers', () => {
    const sql = 'SELECT * FROM "DATABASE"."SCHEMA"."TABLE"';
    const tables = extractPhysicalTables(sql, 'snowflake');
    
    expect(tables).toHaveLength(1);
    expect(tables[0]).toMatchObject({
      database: 'DATABASE',
      schema: 'SCHEMA',
      table: 'TABLE',
      fullName: 'DATABASE.SCHEMA.TABLE'
    });
  });

  it('should handle multiple tables in joins', () => {
    const sql = `
      SELECT u.*, o.name 
      FROM users u 
      JOIN orders o ON u.id = o.user_id
    `;
    const tables = extractPhysicalTables(sql);
    
    expect(tables).toHaveLength(2);
    expect(tables.map(t => t.table)).toEqual(['users', 'orders']);
  });

  it('should ignore CTEs and subqueries', () => {
    const sql = `
      WITH user_stats AS (
        SELECT user_id, COUNT(*) as count 
        FROM orders 
        GROUP BY user_id
      )
      SELECT * FROM users u JOIN user_stats s ON u.id = s.user_id
    `;
    const tables = extractPhysicalTables(sql);
    
    expect(tables).toHaveLength(2);
    expect(tables.map(t => t.table)).toEqual(['orders', 'users']);
  });
});

describe('extractColumnReferences', () => {
  it('should extract columns from WHERE clause', () => {
    const sql = "SELECT id FROM users WHERE status = 'active' AND created_at > '2024-01-01'";
    const columns = extractColumnReferences(sql);
    
    expect(columns.has('users')).toBe(true);
    const userColumns = Array.from(columns.get('users')!);
    expect(userColumns).toContain('id');
    expect(userColumns).toContain('status');
    expect(userColumns).toContain('created_at');
  });

  it('should extract columns from JOIN conditions', () => {
    const sql = `
      SELECT u.id, o.total 
      FROM users u 
      JOIN orders o ON u.id = o.user_id 
      WHERE o.status = 'completed'
    `;
    const columns = extractColumnReferences(sql);
    
    expect(columns.has('users')).toBe(true);
    expect(Array.from(columns.get('users')!)).toEqual(['id']);
    
    expect(columns.has('orders')).toBe(true);
    expect(Array.from(columns.get('orders')!)).toContain('total');
    expect(Array.from(columns.get('orders')!)).toContain('user_id');
    expect(Array.from(columns.get('orders')!)).toContain('status');
  });

  it('should handle SELECT * queries', () => {
    const sql = 'SELECT * FROM users';
    const columns = extractColumnReferences(sql);
    
    // SELECT * doesn't extract individual columns, it returns an empty map
    expect(columns.size).toBe(0);
  });
});

describe('checkQueryIsReadOnly', () => {
  it('should allow SELECT queries', () => {
    const result = checkQueryIsReadOnly('SELECT * FROM users');
    expect(result.isReadOnly).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should allow BigQuery SELECT with backticks', () => {
    const result = checkQueryIsReadOnly(
      "SELECT COUNT(DISTINCT u.user_id) FROM `buster-381916`.analytics.user u",
      'bigquery'
    );
    expect(result.isReadOnly).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should reject INSERT queries', () => {
    const result = checkQueryIsReadOnly("INSERT INTO users VALUES ('test')");
    expect(result.isReadOnly).toBe(false);
    expect(result.error).toContain("Query type 'INSERT' is not allowed");
  });

  it('should reject UPDATE queries', () => {
    const result = checkQueryIsReadOnly("UPDATE users SET name = 'test'");
    expect(result.isReadOnly).toBe(false);
    expect(result.error).toContain("Query type 'UPDATE' is not allowed");
  });

  it('should reject DELETE queries', () => {
    const result = checkQueryIsReadOnly('DELETE FROM users');
    expect(result.isReadOnly).toBe(false);
    expect(result.error).toContain("Query type 'DELETE' is not allowed");
  });

  it('should reject DDL queries', () => {
    const result = checkQueryIsReadOnly('CREATE TABLE test (id INT)');
    expect(result.isReadOnly).toBe(false);
    expect(result.error).toContain("Query type 'CREATE' is not allowed");
  });

  it('should allow SELECT with CTEs', () => {
    const sql = `
      WITH stats AS (SELECT COUNT(*) FROM orders)
      SELECT * FROM stats
    `;
    const result = checkQueryIsReadOnly(sql);
    expect(result.isReadOnly).toBe(true);
  });
});

describe('validateWildcardUsage', () => {
  it('should reject SELECT * on physical tables', () => {
    const result = validateWildcardUsage('SELECT * FROM users');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('SELECT * is not allowed on physical table');
  });

  it('should reject SELECT * on BigQuery tables with backticks', () => {
    const result = validateWildcardUsage(
      'SELECT * FROM `buster-381916`.analytics.user',
      'bigquery'
    );
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('SELECT * is not allowed on physical table');
  });

  it('should allow specific column selection', () => {
    const result = validateWildcardUsage('SELECT id, name FROM users');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should allow specific columns on BigQuery tables', () => {
    const result = validateWildcardUsage(
      "SELECT u.user_id, u.name FROM `buster-381916`.analytics.user u",
      'bigquery'
    );
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should allow SELECT * on CTEs', () => {
    const sql = `
      WITH user_stats AS (
        SELECT user_id, COUNT(*) as count 
        FROM orders 
        GROUP BY user_id
      )
      SELECT * FROM user_stats
    `;
    const result = validateWildcardUsage(sql);
    expect(result.isValid).toBe(true);
  });
});

describe('tablesMatch', () => {
  it('should match exact table names', () => {
    const queryTable = { table: 'users', fullName: 'users' };
    const allowedTable = { table: 'users', fullName: 'users' };
    expect(tablesMatch(queryTable, allowedTable)).toBe(true);
  });

  it('should match with schema qualification', () => {
    const queryTable = { schema: 'public', table: 'users', fullName: 'public.users' };
    const allowedTable = { table: 'users', fullName: 'users' };
    expect(tablesMatch(queryTable, allowedTable)).toBe(true);
  });

  it('should match BigQuery three-part names', () => {
    const queryTable = {
      database: 'buster-381916',
      schema: 'analytics',
      table: 'user',
      fullName: 'buster-381916.analytics.user'
    };
    const allowedTable = {
      database: 'buster-381916',
      schema: 'analytics',
      table: 'user',
      fullName: 'buster-381916.analytics.user'
    };
    expect(tablesMatch(queryTable, allowedTable)).toBe(true);
  });

  it('should be case-insensitive', () => {
    const queryTable = { table: 'USERS', fullName: 'USERS' };
    const allowedTable = { table: 'users', fullName: 'users' };
    expect(tablesMatch(queryTable, allowedTable)).toBe(true);
  });

  it('should not match different tables', () => {
    const queryTable = { table: 'orders', fullName: 'orders' };
    const allowedTable = { table: 'users', fullName: 'users' };
    expect(tablesMatch(queryTable, allowedTable)).toBe(false);
  });
});

describe('extractTablesFromYml', () => {
  it('should extract tables from YML content with models array', () => {
    const yml = `
models:
  - name: users
    database: prod
    schema: public
  - name: orders
    schema: sales
`;
    
    const tables = extractTablesFromYml(yml);
    expect(tables).toHaveLength(2);
    expect(tables[0]).toMatchObject({
      database: 'prod',
      schema: 'public',
      table: 'users',
      fullName: 'prod.public.users'
    });
    expect(tables[1]).toMatchObject({
      schema: 'sales',
      table: 'orders',
      fullName: 'sales.orders'
    });
  });

  it('should handle flat format YML', () => {
    const yml = `
name: user
database: buster-381916
schema: analytics
`;
    
    const tables = extractTablesFromYml(yml);
    expect(tables).toHaveLength(1);
    expect(tables[0]).toMatchObject({
      database: 'buster-381916',
      schema: 'analytics',
      table: 'user',
      fullName: 'buster-381916.analytics.user'
    });
  });

  it('should handle BigQuery project names in models array', () => {
    const yml = `
models:
  - name: user
    database: buster-381916
    schema: analytics
`;
    
    const tables = extractTablesFromYml(yml);
    expect(tables).toHaveLength(1);
    expect(tables[0]).toMatchObject({
      database: 'buster-381916',
      schema: 'analytics',
      table: 'user',
      fullName: 'buster-381916.analytics.user'
    });
  });
});

describe('extractDatasetsFromYml', () => {
  it('should extract datasets with dimensions and measures', () => {
    const yml = `
name: users
database: prod
schema: public
dimensions:
  - name: id
  - name: name
  - name: email
measures:
  - name: count
`;
    
    const datasets = extractDatasetsFromYml(yml);
    expect(datasets).toHaveLength(1);
    expect(datasets[0].table).toBe('users');
    expect(datasets[0].allowedColumns.size).toBe(4);
    expect(datasets[0].allowedColumns.has('id')).toBe(true);
    expect(datasets[0].allowedColumns.has('name')).toBe(true);
    expect(datasets[0].allowedColumns.has('email')).toBe(true);
    expect(datasets[0].allowedColumns.has('count')).toBe(true);
  });

  it('should handle models array with dimensions', () => {
    const yml = `
models:
  - name: orders
    schema: sales
    dimensions:
      - name: id
      - name: status
`;
    
    const datasets = extractDatasetsFromYml(yml);
    expect(datasets).toHaveLength(1);
    expect(datasets[0].table).toBe('orders');
    expect(datasets[0].allowedColumns.size).toBe(2);
    expect(datasets[0].allowedColumns.has('id')).toBe(true);
    expect(datasets[0].allowedColumns.has('status')).toBe(true);
  });

  it('should handle datasets without column restrictions', () => {
    const yml = `
name: products
schema: inventory
`;
    
    const datasets = extractDatasetsFromYml(yml);
    expect(datasets).toHaveLength(1);
    expect(datasets[0].table).toBe('products');
    expect(datasets[0].allowedColumns.size).toBe(0);
  });
});