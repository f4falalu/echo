import { z } from 'zod';
import type { ReportElement } from './report-elements';
import { ReportElementSchema } from './report-elements';

// Define the type explicitly
export type ReportResponse = {
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
};

// Create schema with explicit type annotation
export const ReportResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  file_name: z.string(),
  description: z.string(),
  created_by: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable(),
  publicly_accessible: z.boolean(),
  content: z.lazy(() => z.array(ReportElementSchema)), // Now using the actual schema
}) as z.ZodType<ReportResponse>;
