import { z } from 'zod';
import type { DataMetadata } from '../metrics';

// Request schema for running SQL queries
export const RunSqlRequestSchema = z.object({
  data_source_id: z.string().uuid('Data source ID must be a valid UUID'),
  sql: z.string().min(1, 'SQL query cannot be empty'),
});

export type RunSqlRequest = z.infer<typeof RunSqlRequestSchema>;

// Response type matching the structure from metric responses
export interface RunSqlResponse {
  data: Record<string, string | number | null>[];
  data_metadata: DataMetadata;
  has_more_records: boolean;
}
