import type { z } from 'zod';
import { PaginatedRequestSchema } from '../type-utilities/pagination';
import type { ReportElements } from './report-elements';
import { ReportResponseSchema } from './reports.types';

export const GetReportsListRequestSchema = PaginatedRequestSchema;

// UpdateReportRequestSchema uses zod's .pick to select updatable fields from ReportResponseSchema
export const UpdateReportRequestSchema = ReportResponseSchema.pick({
  name: true,
  description: true,
  publicly_accessible: true,
  content: true,
}).partial();

export type GetReportsListRequest = z.infer<typeof GetReportsListRequestSchema>;
export type UpdateReportRequest = z.infer<typeof UpdateReportRequestSchema>;
