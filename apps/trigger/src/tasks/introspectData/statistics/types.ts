// Temporary types until data-source package is updated
// These match the types from finish-docs-agent branch

export interface ColumnSchema {
  name: string;
  type: string;
  nullable?: boolean;
  length?: number;
  precision?: number;
  scale?: number;
}

export interface TableSample {
  tableId: string; // Composite of database.schema.table
  rowCount: number;
  sampleSize: number;
  sampleData: Record<string, unknown>[]; // Raw sample rows
  columnSchemas?: ColumnSchema[]; // Column schema information
  sampledAt: Date;
  samplingMethod: string; // e.g., "TABLESAMPLE", "RANDOM", etc.
}
