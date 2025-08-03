import { z } from 'zod';
import { PaginatedResponseSchema } from '../type-utilities/pagination';
import { ReportSchema } from './reports.types';

export const GetReportsListResponseSchema = PaginatedResponseSchema(ReportSchema);
export const UpdateReportResponseSchema = ReportSchema;

export type GetReportsListResponse = z.infer<typeof GetReportsListResponseSchema>;
export type UpdateReportResponse = z.infer<typeof UpdateReportResponseSchema>;
