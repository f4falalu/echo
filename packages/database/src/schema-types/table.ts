import { z } from 'zod';

// Table type enum
export const TableTypeSchema = z.enum([
  'TABLE',
  'VIEW',
  'MATERIALIZED_VIEW',
  'EXTERNAL_TABLE',
  'TEMPORARY_TABLE',
]);
export type TableType = z.infer<typeof TableTypeSchema>;
