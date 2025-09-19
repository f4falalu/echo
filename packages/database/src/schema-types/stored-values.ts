import { z } from 'zod';

// Stored values status enum
export const StoredValuesStatusSchema = z.enum(['syncing', 'success', 'failed']);
export type StoredValuesStatus = z.infer<typeof StoredValuesStatusSchema>;
