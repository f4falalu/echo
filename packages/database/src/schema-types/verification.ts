import { z } from 'zod';

// Verification enum
export const VerificationSchema = z.enum([
  'verified',
  'backlogged',
  'inReview',
  'requested',
  'notRequested',
]);
export type Verification = z.infer<typeof VerificationSchema>;
