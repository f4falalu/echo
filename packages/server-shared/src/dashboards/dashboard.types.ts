import { z } from 'zod';
import { VerificationStatusSchema } from '../share';

// Dashboard Config Schema
export const DashboardConfigSchema = z.object({
  rows: z
    .array(
      z.object({
        columnSizes: z.array(z.number().min(1).max(12)).optional(), // columns sizes 1 - 12. MUST add up to 12
        rowHeight: z.number().optional(), // pixel based!
        id: z.string(),
        items: z.array(
          z.object({
            id: z.string(),
          })
        ),
      })
    )
    .optional(),
});

// Dashboard Schema
export const DashboardSchema = z.object({
  config: DashboardConfigSchema,
  created_at: z.string(),
  created_by: z.string(),
  deleted_at: z.string().nullable(),
  description: z.string().nullable(),
  id: z.string(),
  name: z.string(),
  updated_at: z.string().nullable(),
  updated_by: z.string(),
  status: VerificationStatusSchema,
  version_number: z.number(),
  file: z.string(), // yaml file
  file_name: z.string(),
});

// Export inferred types
export type DashboardConfig = z.infer<typeof DashboardConfigSchema>;
export type Dashboard = z.infer<typeof DashboardSchema>;
