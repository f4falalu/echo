import { getPermissionedDatasets } from '@buster/access-controls';
import {
  type ParsedDataset,
  type ParsedTable,
  checkQueryIsReadOnly,
  extractColumnReferences,
  extractDatasetsFromYml,
  extractPhysicalTables,
  extractTablesFromYml,
  tablesMatch,
  validateWildcardUsage,
} from './sql-parser-helpers.js';

export interface UnauthorizedColumn {
  table: string;
  column: string;
}

export interface PermissionValidationResult {
  isAuthorized: boolean;
  unauthorizedTables: string[];
  unauthorizedColumns?: UnauthorizedColumn[];
  error?: string;
}

/**
 * Validates SQL query against user's permissioned datasets
 * Checks that all tables and columns referenced in the query are accessible to the user
 */
export async function validateSqlPermissions(
  sql: string,
  userId: string,
  dataSourceSyntax?: string
): Promise<PermissionValidationResult> {
  try {
    // First check if query is read-only
    const readOnlyCheck = checkQueryIsReadOnly(sql, dataSourceSyntax);
    if (!readOnlyCheck.isReadOnly) {
      return {
        isAuthorized: false,
        unauthorizedTables: [],
        error: readOnlyCheck.error || 'Only read-only queries are allowed',
      };
    }

    const wildcardCheck = validateWildcardUsage(sql, dataSourceSyntax);
    // Store the wildcard error but continue to validate columns to provide comprehensive feedback
    let wildcardError: string | undefined;
    if (!wildcardCheck.isValid) {
      wildcardError = wildcardCheck.error || 'Wildcard usage on physical tables is not allowed';
    }

    // Extract physical tables from SQL
    const tablesInQuery = extractPhysicalTables(sql, dataSourceSyntax);

    if (tablesInQuery.length === 0) {
      // No tables referenced (might be a function call or constant select)
      return { isAuthorized: true, unauthorizedTables: [] };
    }

    // Get user's permissioned datasets
    const permissionedDatasets = await getPermissionedDatasets({
      userId,
      page: 0,
      pageSize: 1000,
    });

    // Extract all allowed tables and datasets from permissions
    const allowedTables: ParsedTable[] = [];
    const allowedDatasets: ParsedDataset[] = [];

    for (const dataset of permissionedDatasets.datasets) {
      if (dataset.ymlContent) {
        const tables = extractTablesFromYml(dataset.ymlContent);
        allowedTables.push(...tables);

        const datasetsWithColumns = extractDatasetsFromYml(dataset.ymlContent);
        allowedDatasets.push(...datasetsWithColumns);
      }
    }

    // Check each table in query against permissions
    const unauthorizedTables: string[] = [];

    for (const queryTable of tablesInQuery) {
      let isAuthorized = false;

      // Check if query table matches any allowed table
      for (const allowedTable of allowedTables) {
        const matches = tablesMatch(queryTable, allowedTable);
        if (matches) {
          isAuthorized = true;
          break;
        }
      }

      if (!isAuthorized) {
        unauthorizedTables.push(queryTable.fullName);
      }
    }

    // Continue to validate column-level permissions even if tables are unauthorized
    // This allows us to report both unauthorized tables AND their columns
    const columnReferences = extractColumnReferences(sql, dataSourceSyntax);
    const unauthorizedColumns: UnauthorizedColumn[] = [];

    for (const [tableName, columns] of columnReferences) {
      // Find the matching allowed dataset for this table
      let matchingDataset: ParsedDataset | undefined;

      for (const dataset of allowedDatasets) {
        // Check if table names match (case-insensitive)
        const tableNameLower = tableName.toLowerCase();
        const datasetFullNameLower = dataset.fullName.toLowerCase();
        const datasetTableLower = dataset.table.toLowerCase();

        // Handle different qualification levels - check both fullName and table
        if (
          tableNameLower === datasetFullNameLower ||
          tableNameLower === datasetTableLower ||
          tableNameLower.endsWith(`.${datasetTableLower}`) ||
          datasetFullNameLower === tableNameLower
        ) {
          matchingDataset = dataset;
          break;
        }
      }

      if (matchingDataset) {
        // Found a matching dataset - validate columns if it has restrictions
        if (matchingDataset.allowedColumns.size > 0) {
          for (const column of columns) {
            if (!matchingDataset.allowedColumns.has(column.toLowerCase())) {
              unauthorizedColumns.push({
                table: tableName,
                column: column,
              });
            }
          }
        }
        // If dataset has no column restrictions, it's backward compatibility mode (allow all columns)
      } else {
        // No matching dataset found - this table is completely unauthorized
        // Check if this table was already marked as unauthorized
        const isTableUnauthorized = unauthorizedTables.some((t) => {
          const tLower = t.toLowerCase();
          const tableNameLower = tableName.toLowerCase();
          return (
            tLower === tableNameLower ||
            tLower.endsWith(`.${tableNameLower.split('.').pop()}`) ||
            tableNameLower.endsWith(`.${tLower.split('.').pop()}`)
          );
        });

        if (isTableUnauthorized) {
          // Table is unauthorized, so all its columns are also unauthorized
          for (const column of columns) {
            unauthorizedColumns.push({
              table: tableName,
              column: column,
            });
          }
        }
      }
    }

    const result: PermissionValidationResult = {
      isAuthorized:
        unauthorizedTables.length === 0 && unauthorizedColumns.length === 0 && !wildcardError,
      unauthorizedTables,
    };

    if (unauthorizedColumns.length > 0) {
      result.unauthorizedColumns = unauthorizedColumns;
    }

    if (wildcardError) {
      result.error = wildcardError;
    }

    return result;
  } catch (error) {
    return {
      isAuthorized: false,
      unauthorizedTables: [],
      error: `Permission validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Creates a detailed error message for unauthorized table or column access
 */
export function createPermissionErrorMessage(
  unauthorizedTables: string[],
  unauthorizedColumns?: UnauthorizedColumn[]
): string {
  const messages: string[] = [];

  // Handle unauthorized tables
  if (unauthorizedTables.length > 0) {
    const tableList = unauthorizedTables.join(', ');
    if (unauthorizedTables.length === 1) {
      messages.push(`You do not have access to table: ${tableList}`);
    } else {
      messages.push(`You do not have access to the following tables: ${tableList}`);
    }
  }

  // Handle unauthorized columns
  if (unauthorizedColumns && unauthorizedColumns.length > 0) {
    // Group columns by table for better error messages
    const columnsByTable = new Map<string, string[]>();

    for (const { table, column } of unauthorizedColumns) {
      if (!columnsByTable.has(table)) {
        columnsByTable.set(table, []);
      }
      const tableColumns = columnsByTable.get(table);
      if (tableColumns) {
        tableColumns.push(column);
      }
    }

    const columnMessages: string[] = [];
    for (const [table, columns] of columnsByTable) {
      const columnList = columns.join(', ');
      columnMessages.push(`Table '${table}': columns [${columnList}] are not available`);
    }

    if (columnMessages.length === 1) {
      messages.push(`Unauthorized column access - ${columnMessages[0]}`);
    } else {
      messages.push(
        `Unauthorized column access:\n${columnMessages.map((m) => `  - ${m}`).join('\n')}`
      );
    }
  }

  if (messages.length === 0) {
    return '';
  }

  return `Insufficient permissions: ${messages.join('. ')}`;
}
