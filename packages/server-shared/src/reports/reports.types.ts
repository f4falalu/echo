import { z } from 'zod';
import type { ReportElements } from './report-elements';

export const ReportSchema = z.object({
  id: z.string(),
  name: z.string(),
  file_name: z.string(),
  description: z.string(),
  created_by: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  publicly_accessible: z.boolean(),
  content: z.any() as z.ZodType<ReportElements>,
});

export type Report = z.infer<typeof ReportSchema>;
