import type { z } from 'zod';
import { PaginatedResponseSchema } from '../type-utilities/pagination';
import { ReportResponseSchema } from './reports.types';

export const GetReportsListResponseSchema = PaginatedResponseSchema(ReportResponseSchema);
export const UpdateReportResponseSchema = ReportResponseSchema;

export type GetReportsListResponse = z.infer<typeof GetReportsListResponseSchema>;
export type UpdateReportResponse = z.infer<typeof UpdateReportResponseSchema>;
