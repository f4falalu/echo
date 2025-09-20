import { z } from 'zod';

export const GetDashboardParamsSchema = z.object({
  id: z.string().uuid('Dashboard ID must be a valid UUID'),
});

export const GetDashboardQuerySchema = z.object({
  password: z.string().optional(),
  version_number: z.coerce.number().optional(),
});

// Export inferred types
export type GetDashboardParams = z.infer<typeof GetDashboardParamsSchema>;
export type GetDashboardQuery = z.infer<typeof GetDashboardQuerySchema>;
