import { z } from 'zod';

export const CreateApiKeyResponseSchema = z.object({
  api_key: z.string().describe('API Key is required'),
});

export type CreateApiKeyResponse = z.infer<typeof CreateApiKeyResponseSchema>;

export const BusterApiKeyListItemSchema = z.object({
  id: z.string(),
  owner_id: z.string().describe('Owner ID is required'),
  owner_email: z.string().describe('Owner email is required'),
  created_at: z.string().describe('Created at is required'),
});

export type BusterApiKeyListItem = z.infer<typeof BusterApiKeyListItemSchema>;

// API Response schemas
export const GetApiKeysResponseSchema = z.object({
  api_keys: z.array(BusterApiKeyListItemSchema),
});

export type GetApiKeysResponse = z.infer<typeof GetApiKeysResponseSchema>;
