import { z } from 'zod';
import { PaginatedRequestSchema } from '../type-utilities/pagination';

export const GetReportsListRequestSchema = PaginatedRequestSchema;

// Define UpdateReportRequestSchema with explicit type annotation
export const UpdateReportRequestSchema = z
  .object({
    name: z.string().optional(),
    update_version: z.boolean().optional(),
    content: z.string().optional(), //content will be validated as string in the database
  })
  .partial();

export type UpdateReportRequest = z.infer<typeof UpdateReportRequestSchema>;
export type GetReportsListRequest = z.infer<typeof GetReportsListRequestSchema>;
