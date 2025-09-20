import { z } from 'zod';

// GitHub integration status enum
export const GithubIntegrationStatusSchema = z.enum(['pending', 'active', 'suspended', 'revoked']);
export type GithubIntegrationStatus = z.infer<typeof GithubIntegrationStatusSchema>;
