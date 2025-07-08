import { z } from 'zod/v4';

export const ColumnMetaDataSchema = z.object({
  name: z.string(),
  min_value: z.union([z.number(), z.string()]),
  max_value: z.union([z.number(), z.string()]),
  unique_values: z.number(),
  simple_type: z.enum(['text', 'number', 'date']),
  type: z.enum([
    'text',
    'float',
    'integer',
    'date',
    'float8',
    'timestamp',
    'timestamptz',
    'bool',
    'time',
    'boolean',
    'json',
    'jsonb',
    'int8',
    'int4',
    'int2',
    'decimal',
    'char',
    'character varying',
    'character',
    'varchar',
    'number',
    'numeric',
    'tinytext',
    'mediumtext',
    'longtext',
    'nchar',
    'nvarchat',
    'ntext',
    'float4',
  ]),
});

export const DataMetadataSchema = z
  .object({
    column_count: z.number(),
    column_metadata: z.array(ColumnMetaDataSchema),
    row_count: z.number(),
  })
  .nullable();

export const DataResultSchema = z.array(
  z.record(z.string(), z.union([z.number(), z.string(), z.null()]))
);

export type DataResult = z.infer<typeof DataResultSchema>;
export type ColumnMetaData = z.infer<typeof ColumnMetaDataSchema>;
export type DataMetadata = z.infer<typeof DataMetadataSchema>;
