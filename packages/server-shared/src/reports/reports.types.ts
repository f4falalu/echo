import { z } from 'zod';
import { ReportElementsSchema } from './report-elements';

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
  content: ReportElementsSchema,
});

export type Report = z.infer<typeof ReportSchema>;
