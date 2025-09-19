import { z } from 'zod';

// Storage provider enum
export const StorageProviderSchema = z.enum(['s3', 'r2', 'gcs']);
export type StorageProvider = z.infer<typeof StorageProviderSchema>;
