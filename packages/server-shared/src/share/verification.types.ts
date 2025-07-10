import { z } from 'zod';

export const VerificationStatusSchema = z.enum([
  'notRequested',
  'requested',
  'inReview',
  'verified',
  'backlogged',
  'notVerified',
]);

export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;
