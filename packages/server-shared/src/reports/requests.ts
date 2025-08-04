import { ReportElementSchema, type ReportElements } from '@buster/database';
import { z } from 'zod';
import { PaginatedRequestSchema } from '../type-utilities/pagination';

export const GetReportsListRequestSchema = PaginatedRequestSchema;

// Define UpdateReportRequestSchema with explicit type annotation
export const UpdateReportRequestSchema = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    publicly_accessible: z.boolean().optional(),
    content: z.lazy(() => z.array(ReportElementSchema)).optional() as z.ZodOptional<
      z.ZodType<ReportElements>
    >,
  })
  .partial();

export type UpdateReportRequest = z.infer<typeof UpdateReportRequestSchema>;
export type GetReportsListRequest = z.infer<typeof GetReportsListRequestSchema>;
