import { z } from 'zod';

// Data source onboarding status enum
export const DataSourceOnboardingStatusSchema = z.enum([
  'notStarted',
  'inProgress',
  'completed',
  'failed',
]);
export type DataSourceOnboardingStatus = z.infer<typeof DataSourceOnboardingStatusSchema>;

// Dataset type enum
export const DatasetTypeSchema = z.enum(['table', 'view', 'materializedView']);
export type DatasetType = z.infer<typeof DatasetTypeSchema>;
