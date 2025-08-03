import { z } from 'zod';
import { PaginatedResponseSchema } from '../type-utilities/pagination';
import { ReportSchema, type Report } from './reports.types';

export const GetReportsListResponseSchema = PaginatedResponseSchema(ReportSchema);
export const UpdateReportResponseSchema = ReportSchema;

export type GetReportsListResponse = z.infer<typeof GetReportsListResponseSchema>;
export type UpdateReportResponse = Report;
