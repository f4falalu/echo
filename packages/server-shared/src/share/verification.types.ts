import { VerificationSchema } from '@buster/database/schema-types';
import type { z } from 'zod';

export const VerificationStatusSchema = VerificationSchema;

export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;
