import { BaseFrom, ColumnRefItem, Join, Parser, type Select } from 'node-sql-parser';
import * as yaml from 'yaml';

export interface ParsedTable {
  database?: string;
  schema?: string;
  table: string;
  fullName: string;
  alias?: string;
}

export interface QueryTypeCheckResult {
  isReadOnly: boolean;
  queryType?: string;
  error?: string;
}

export interface WildcardValidationResult {
  isValid: boolean;
  error?: string;
  blockedTables?: string[];
}

// Map data source syntax to node-sql-parser dialect
const DIALECT_MAPPING: Record<string, string> = {
  // Direct mappings
  mysql: 'mysql',
  postgresql: 'postgresql',
  sqlite: 'sqlite',
  mariadb: 'mariadb',
  bigquery: 'bigquery',
  snowflake: 'snowflake',
  redshift: 'postgresql', // Redshift uses PostgreSQL dialect
  transactsql: 'transactsql',
  flinksql: 'flinksql',
  hive: 'hive',

  // Alternative names
  postgres: 'postgresql',
  mssql: 'transactsql',
  sqlserver: 'transactsql',
  athena: 'postgresql', // Athena uses Presto/PostgreSQL syntax
  db2: 'db2',
  noql: 'mysql', // Default fallback for NoQL
};

function getParserDialect(dataSourceSyntax?: string): string {
  if (!dataSourceSyntax) {
    return 'postgresql';
  }

  const dialect = DIALECT_MAPPING[dataSourceSyntax.toLowerCase()];
  if (!dialect) {
    return 'postgresql';
  }

  return dialect;
}

/**
 * Extracts physical tables from SQL query, excluding CTEs
 * Returns database.schema.table references with proper qualification
 */
export function extractPhysicalTables(sql: string, dataSourceSyntax?: string): ParsedTable[] {
  const dialect = getParserDialect(dataSourceSyntax);
  const parser = new Parser();

  try {
    // Parse SQL into AST with the appropriate dialect
    const ast = parser.astify(sql, { database: dialect });

    // Get all table references from parser with the appropriate dialect
    const allTables = parser.tableList(sql, { database: dialect });

    // Extract CTE names to exclude them
    const cteNames = new Set<string>();

    // Handle single statement or array of statements
    const statements = Array.isArray(ast) ? ast : [ast];

    for (const statement of statements) {
      // Type guard to check if statement has 'with' property
      if ('with' in statement && statement.with && Array.isArray(statement.with)) {
        for (const cte of statement.with) {
          if (cte.name?.value) {
            cteNames.add(cte.name.value.toLowerCase());
          }
        }
      }
    }

    // Parse table references and filter out CTEs
    const physicalTables: ParsedTable[] = [];
    const processedTables = new Set<string>();

    for (const tableRef of allTables) {
      const parsed = parseTableReference(tableRef);

      // Skip if it's a CTE
      if (cteNames.has(parsed.table.toLowerCase())) {
        continue;
      }

      // Skip duplicates
      const tableKey = `${parsed.database || ''}.${parsed.schema || ''}.${parsed.table}`;
      if (processedTables.has(tableKey)) {
        continue;
      }

      processedTables.add(tableKey);
      physicalTables.push(parsed);
    }

    return physicalTables;
  } catch (error) {
    throw new Error(
      `Failed to parse SQL: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Parses a table reference string into its components
 * Handles formats like:
 * - table
 * - schema.table
 * - database.schema.table
 * - type::database::table (node-sql-parser format)
 * - type::schema.table (node-sql-parser format)
 */
export function parseTableReference(tableRef: string): ParsedTable {
  // Remove any quotes and trim
  let cleanRef = tableRef.replace(/["'`\[\]]/g, '').trim();

  // Handle node-sql-parser format: "type::database::table" or "type::table"
  if (cleanRef.includes('::')) {
    const parts = cleanRef.split('::');
    // Remove the type prefix (select, insert, update, etc.)
    const firstPart = parts[0];
    if (
      parts.length >= 2 &&
      firstPart &&
      ['select', 'insert', 'update', 'delete', 'create', 'drop', 'alter'].includes(firstPart)
    ) {
      parts.shift(); // Remove type
    }
    cleanRef = parts.join('.');
  }

  // Split by . for schema/table
  const parts = cleanRef.split('.').filter((p) => p && p !== 'null');

  if (parts.length === 3) {
    const [database, schema, table] = parts;
    if (!database || !schema || !table) {
      return {
        table: cleanRef,
        fullName: cleanRef,
      };
    }
    return {
      database,
      schema,
      table,
      fullName: `${database}.${schema}.${table}`,
    };
  }

  if (parts.length === 2) {
    const [schema, table] = parts;
    if (!schema || !table) {
      return {
        table: cleanRef,
        fullName: cleanRef,
      };
    }
    return {
      schema,
      table,
      fullName: `${schema}.${table}`,
    };
  }

  if (parts.length === 1) {
    const [table] = parts;
    if (!table) {
      return {
        table: cleanRef,
        fullName: cleanRef,
      };
    }
    return {
      table,
      fullName: table,
    };
  }

  return {
    table: cleanRef,
    fullName: cleanRef,
  };
}

/**
 * Normalizes a table identifier for comparison
 * Converts to lowercase and handles different qualification levels
 */
export function normalizeTableIdentifier(identifier: ParsedTable): string {
  const parts = [];

  if (identifier.database) {
    parts.push(identifier.database.toLowerCase());
  }
  if (identifier.schema) {
    parts.push(identifier.schema.toLowerCase());
  }
  parts.push(identifier.table.toLowerCase());

  return parts.join('.');
}

/**
 * Checks if two table identifiers match, considering different qualification levels
 * For example, "schema.table" matches "database.schema.table" if schema and table match
 */
export function tablesMatch(queryTable: ParsedTable, permissionTable: ParsedTable): boolean {
  // Exact table name must match
  if (queryTable.table.toLowerCase() !== permissionTable.table.toLowerCase()) {
    return false;
  }

  // If permission specifies schema, query must match
  if (permissionTable.schema && queryTable.schema) {
    if (permissionTable.schema.toLowerCase() !== queryTable.schema.toLowerCase()) {
      return false;
    }
  }

  // If permission specifies database, query must match
  if (permissionTable.database && queryTable.database) {
    if (permissionTable.database.toLowerCase() !== queryTable.database.toLowerCase()) {
      return false;
    }
  }

  // If permission has schema but query doesn't, it's not a match
  // (we require explicit schema matching for security)
  if (permissionTable.schema && !queryTable.schema) {
    return false;
  }

  return true;
}

/**
 * Extracts table references from dataset YML content
 * Handles multiple formats:
 * 1. Flat format (top-level fields):
 *    name: table_name
 *    schema: schema_name
 *    database: database_name
 * 2. Models array with separate fields:
 *    models:
 *      - name: table_name
 *        schema: schema_name
 *        database: database_name
 */
export function extractTablesFromYml(ymlContent: string): ParsedTable[] {
  const tables: ParsedTable[] = [];
  const processedTables = new Set<string>();

  try {
    // Parse YML content
    const parsed = yaml.parse(ymlContent);

    // Check for flat format (top-level name, schema, database)
    if (parsed?.name && !parsed?.models && (parsed?.schema || parsed?.database)) {
      const parsedTable: ParsedTable = {
        table: parsed.name,
        fullName: parsed.name,
      };

      // Add schema if present
      if (parsed.schema) {
        parsedTable.schema = parsed.schema;
        parsedTable.fullName = `${parsed.schema}.${parsed.name}`;
      }

      // Add database if present
      if (parsed.database) {
        parsedTable.database = parsed.database;
        if (parsed.schema) {
          parsedTable.fullName = `${parsed.database}.${parsed.schema}.${parsed.name}`;
        } else {
          parsedTable.fullName = `${parsed.database}.${parsed.name}`;
        }
      }

      const key = normalizeTableIdentifier(parsedTable);
      if (!processedTables.has(key)) {
        processedTables.add(key);
        tables.push(parsedTable);
      }
    }

    // Look for models array
    if (parsed?.models && Array.isArray(parsed.models)) {
      for (const model of parsed.models) {
        // Process models that have name and at least schema or database
        if (model.name && (model.schema || model.database)) {
          const parsedTable: ParsedTable = {
            table: model.name,
            fullName: model.name,
          };

          // Add schema if present
          if (model.schema) {
            parsedTable.schema = model.schema;
            parsedTable.fullName = `${model.schema}.${model.name}`;
          }

          // Add database if present
          if (model.database) {
            parsedTable.database = model.database;
            if (model.schema) {
              parsedTable.fullName = `${model.database}.${model.schema}.${model.name}`;
            } else {
              parsedTable.fullName = `${model.database}.${model.name}`;
            }
          }

          const key = normalizeTableIdentifier(parsedTable);
          if (!processedTables.has(key)) {
            processedTables.add(key);
            tables.push(parsedTable);
          }
        }
      }
    }
  } catch (_error) {
    // If YML parsing fails, return empty array
  }

  return tables;
}

/**
 * Validates that wildcards (SELECT *) are not used on physical tables
 * Allows wildcards on CTEs but blocks them on physical database tables
 */
export function validateWildcardUsage(
  sql: string,
  dataSourceSyntax?: string
): WildcardValidationResult {
  const dialect = getParserDialect(dataSourceSyntax);
  const parser = new Parser();

  try {
    // Parse SQL into AST with the appropriate dialect
    const ast = parser.astify(sql, { database: dialect });

    // Handle single statement or array of statements
    const statements = Array.isArray(ast) ? ast : [ast];

    // Extract CTE names to allow wildcards on them
    const cteNames = new Set<string>();
    for (const statement of statements) {
      if ('with' in statement && statement.with && Array.isArray(statement.with)) {
        for (const cte of statement.with) {
          if (cte.name?.value) {
            cteNames.add(cte.name.value.toLowerCase());
          }
        }
      }
    }

    const tableList = parser.tableList(sql, { database: dialect });
    const tableAliasMap = new Map<string, string>(); // alias -> table name

    if (Array.isArray(tableList)) {
      for (const tableRef of tableList) {
        if (typeof tableRef === 'string') {
          // Simple table name
          tableAliasMap.set(tableRef.toLowerCase(), tableRef);
        } else if (tableRef && typeof tableRef === 'object') {
          const tableRefObj = tableRef as Record<string, unknown>;
          const tableName = tableRefObj.table || tableRefObj.name;
          const alias = tableRefObj.as || tableRefObj.alias;
          if (tableName && typeof tableName === 'string') {
            if (alias && typeof alias === 'string') {
              tableAliasMap.set(alias.toLowerCase(), tableName);
            }
            tableAliasMap.set(tableName.toLowerCase(), tableName);
          }
        }
      }
    }

    // Check each statement for wildcard usage
    const blockedTables: string[] = [];

    for (const statement of statements) {
      if ('type' in statement && statement.type === 'select') {
        const wildcardTables = findWildcardUsageOnPhysicalTables(
          statement as unknown as Record<string, unknown>,
          cteNames
        );
        blockedTables.push(...wildcardTables);
      }
    }

    if (blockedTables.length > 0) {
      return {
        isValid: false,
        error: `You're not allowed to use a wildcard on physical tables, please be specific about which columns you'd like to work with`,
        blockedTables,
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: `Failed to validate wildcard usage: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Recursively finds wildcard usage on physical tables in a SELECT statement
 */
function findWildcardUsageOnPhysicalTables(
  selectStatement: Record<string, unknown>,
  cteNames: Set<string>
): string[] {
  const blockedTables: string[] = [];

  // Build alias mapping for this statement
  const aliasToTableMap = new Map<string, string>();
  if (selectStatement.from && Array.isArray(selectStatement.from)) {
    for (const fromItem of selectStatement.from) {
      const fromItemAny = fromItem as unknown as Record<string, unknown>;
      if (fromItemAny.table && fromItemAny.as) {
        let tableName: string;
        if (typeof fromItemAny.table === 'string') {
          tableName = fromItemAny.table;
        } else if (fromItemAny.table && typeof fromItemAny.table === 'object') {
          const tableObj = fromItemAny.table as Record<string, unknown>;
          tableName = String(
            tableObj.table || tableObj.name || tableObj.value || fromItemAny.table
          );
        } else {
          continue;
        }
        aliasToTableMap.set(String(fromItemAny.as).toLowerCase(), tableName.toLowerCase());
      }

      // Handle JOINs
      if (fromItemAny.join && Array.isArray(fromItemAny.join)) {
        for (const joinItem of fromItemAny.join) {
          if (joinItem.table && joinItem.as) {
            let tableName: string;
            if (typeof joinItem.table === 'string') {
              tableName = joinItem.table;
            } else if (joinItem.table && typeof joinItem.table === 'object') {
              const tableObj = joinItem.table as Record<string, unknown>;
              tableName = String(
                tableObj.table || tableObj.name || tableObj.value || joinItem.table
              );
            } else {
              continue;
            }
            aliasToTableMap.set(String(joinItem.as).toLowerCase(), tableName.toLowerCase());
          }
        }
      }
    }
  }

  if (selectStatement.columns && Array.isArray(selectStatement.columns)) {
    for (const column of selectStatement.columns) {
      if (column.expr && column.expr.type === 'column_ref') {
        // Check for unqualified wildcard (SELECT *)
        if (column.expr.column === '*' && !column.expr.table) {
          // Get all tables in FROM clause that are not CTEs
          const physicalTables = getPhysicalTablesFromFrom(
            selectStatement.from as unknown as Record<string, unknown>[],
            cteNames
          );
          blockedTables.push(...physicalTables);
        }
        // Check for qualified wildcard (SELECT table.*)
        else if (column.expr.column === '*' && column.expr.table) {
          // Handle table reference - could be string or object
          let tableName: string;
          if (typeof column.expr.table === 'string') {
            tableName = column.expr.table;
          } else if (column.expr.table && typeof column.expr.table === 'object') {
            // Handle object format - could have table property or be the table name itself
            const tableRefObj = column.expr.table as Record<string, unknown>;
            tableName = String(
              tableRefObj.table || tableRefObj.name || tableRefObj.value || column.expr.table
            );
          } else {
            continue; // Skip if we can't determine table name
          }

          // Check if this is an alias that maps to a CTE
          const actualTableName = aliasToTableMap.get(tableName.toLowerCase());
          const isAliasToCte = actualTableName && cteNames.has(actualTableName);
          const isDirectCte = cteNames.has(tableName.toLowerCase());

          if (!isAliasToCte && !isDirectCte) {
            blockedTables.push(tableName);
          }
        }
      }
    }
  }

  // Check CTEs for nested wildcard usage
  if (selectStatement.with && Array.isArray(selectStatement.with)) {
    for (const cte of selectStatement.with) {
      const cteAny = cte as unknown as Record<string, unknown>;
      if (cteAny.stmt && typeof cteAny.stmt === 'object' && cteAny.stmt !== null) {
        const stmt = cteAny.stmt as Record<string, unknown>;
        if (stmt.type === 'select') {
          const subBlocked = findWildcardUsageOnPhysicalTables(stmt, cteNames);
          blockedTables.push(...subBlocked);
        }
      }
    }
  }

  if (selectStatement.from && Array.isArray(selectStatement.from)) {
    for (const fromItem of selectStatement.from) {
      const fromItemAny = fromItem as unknown as Record<string, unknown>;
      if (fromItemAny.expr && typeof fromItemAny.expr === 'object' && fromItemAny.expr !== null) {
        const expr = fromItemAny.expr as Record<string, unknown>;
        if (expr.type === 'select') {
          const subBlocked = findWildcardUsageOnPhysicalTables(expr, cteNames);
          blockedTables.push(...subBlocked);
        }
      }
    }
  }

  return blockedTables;
}

/**
 * Extracts physical table names from FROM clause, excluding CTEs
 */
function getPhysicalTablesFromFrom(
  fromClause: Record<string, unknown>[],
  cteNames: Set<string>
): string[] {
  const tables: string[] = [];

  if (!fromClause || !Array.isArray(fromClause)) {
    return tables;
  }

  for (const fromItem of fromClause) {
    // Extract table name from fromItem
    if (fromItem.table) {
      let tableName: string;
      if (typeof fromItem.table === 'string') {
        tableName = fromItem.table;
      } else if (fromItem.table && typeof fromItem.table === 'object') {
        const tableObj = fromItem.table as Record<string, unknown>;
        tableName = String(tableObj.table || tableObj.name || tableObj.value || fromItem.table);
      } else {
        continue;
      }

      if (tableName && !cteNames.has(tableName.toLowerCase())) {
        const aliasName = fromItem.as || tableName;
        tables.push(String(aliasName));
      }
    }

    // Handle JOINs
    if (fromItem.join && Array.isArray(fromItem.join)) {
      for (const joinItem of fromItem.join) {
        if (joinItem.table) {
          let tableName: string;
          if (typeof joinItem.table === 'string') {
            tableName = joinItem.table;
          } else if (joinItem.table && typeof joinItem.table === 'object') {
            const tableObj = joinItem.table as Record<string, unknown>;
            tableName = String(tableObj.table || tableObj.name || tableObj.value || joinItem.table);
          } else {
            continue;
          }

          if (tableName && !cteNames.has(tableName.toLowerCase())) {
            const aliasName = joinItem.as || tableName;
            tables.push(String(aliasName));
          }
        }
      }
    }
  }

  return tables;
}

/**
 * Checks if a SQL query is read-only (SELECT statements only)
 * Returns error if query contains write operations
 */
export function checkQueryIsReadOnly(sql: string, dataSourceSyntax?: string): QueryTypeCheckResult {
  const dialect = getParserDialect(dataSourceSyntax);
  const parser = new Parser();

  try {
    // Parse SQL into AST with the appropriate dialect
    const ast = parser.astify(sql, { database: dialect });

    // Handle single statement or array of statements
    const statements = Array.isArray(ast) ? ast : [ast];

    // Check each statement
    for (const statement of statements) {
      // Check if statement has a type property
      if ('type' in statement && statement.type) {
        const queryType = statement.type.toLowerCase();

        // Only allow SELECT statements
        if (queryType !== 'select') {
          return {
            isReadOnly: false,
            queryType: statement.type,
            error: `Query type '${statement.type}' is not allowed. Only SELECT statements are permitted for read-only access.`,
          };
        }
      }
    }

    return {
      isReadOnly: true,
      queryType: 'select',
    };
  } catch (error) {
    return {
      isReadOnly: false,
      error: `Failed to parse SQL for query type check: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
