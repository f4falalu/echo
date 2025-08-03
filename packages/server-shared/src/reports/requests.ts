import { z } from 'zod';
import { ReportElementsSchema } from './report-elements';

export const GetReportsListRequestSchema = z.object({
  page_token: z.number().optional().default(0),
  page_size: z.number().optional().default(50),
});

const BaseUpdateRequestSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  publicly_accessible: z.boolean().optional(),
});

export const UpdateReportRequestSchema = BaseUpdateRequestSchema.extend({
  content: ReportElementsSchema.optional(),
});

export type GetReportsListRequest = z.infer<typeof GetReportsListRequestSchema>;
export type UpdateReportRequest = z.infer<typeof UpdateReportRequestSchema>;
