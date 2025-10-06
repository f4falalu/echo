import type { DatasetMetadata } from '@buster/database/schema-types';
import { z } from 'zod';

// Request schema for getting dataset metadata
export const GetMetadataRequestSchema = z.object({
  database: z.string().min(1, 'Database name cannot be empty'),
  schema: z.string().min(1, 'Schema name cannot be empty'),
  name: z.string().min(1, 'Dataset name cannot be empty'),
});

export type GetMetadataRequest = z.infer<typeof GetMetadataRequestSchema>;

// Response type for metadata retrieval
export interface GetMetadataResponse {
  metadata: DatasetMetadata;
}
