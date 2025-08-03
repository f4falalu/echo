import { z } from 'zod';
import type { ReportElement, ReportElements } from './report-elements';
import { ReportElementSchema } from './report-elements';

const ReportResponseSchema: z.ZodType<{
  id: string;
  name: string;
  file_name: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  publicly_accessible: boolean;
  content: ReportElement[];
}> = z.object({
  id: z.string(),
  name: z.string(),
  file_name: z.string(),
  description: z.string(),
  created_by: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  publicly_accessible: z.boolean(),
  content: z.array(ReportElementSchema) as z.ZodType<ReportElements>,
});

// Export base schema for operations like .pick()
export { ReportResponseSchema };

export type ReportResponse = z.infer<typeof ReportResponseSchema>;
