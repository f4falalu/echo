import type { z } from 'zod';
import { PaginatedResponseSchema } from '../type-utilities/pagination';
import { ReportListItemSchema, ReportResponseSchema } from './reports.types';

export const GetReportsListResponseSchema = PaginatedResponseSchema(ReportListItemSchema);
export const UpdateReportResponseSchema = ReportResponseSchema;
export const ShareUpdateResponseSchema = ReportResponseSchema;

export type GetReportsListResponse = z.infer<typeof GetReportsListResponseSchema>;
export type UpdateReportResponse = z.infer<typeof UpdateReportResponseSchema>;
export type GetReportResponse = z.infer<typeof ReportResponseSchema>;
export type ShareUpdateResponse = z.infer<typeof ShareUpdateResponseSchema>;
