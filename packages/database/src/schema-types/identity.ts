import { z } from 'zod';

// Identity type enum
export const IdentityTypeSchema = z.enum(['user', 'team', 'organization']);
export type IdentityType = z.infer<typeof IdentityTypeSchema>;
