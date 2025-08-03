import { z } from 'zod';
import { ReportElementsSchema } from './report-elements';

export const GetReportsListRequestSchema = z.object({
  page_token: z.number().optional().default(0),
  page_size: z.number().optional().default(50),
});

export const UpdateReportRequestSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  publicly_accessible: z.boolean().optional(),
  content: ReportElementsSchema.optional(),
});

export type GetReportsListRequest = z.infer<typeof GetReportsListRequestSchema>;
export type UpdateReportRequest = z.infer<typeof UpdateReportRequestSchema>;
