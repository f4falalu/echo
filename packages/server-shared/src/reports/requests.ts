import type { ReportElements } from '@buster/database';
import { z } from 'zod';
import { WorkspaceSharingSchema } from '../shared-permissions';
import { PaginatedRequestSchema } from '../type-utilities/pagination';

export const GetReportsListRequestSchema = PaginatedRequestSchema;

// Define UpdateReportRequestSchema with explicit type annotation
export const UpdateReportRequestSchema = z
  .object({
    name: z.string().optional(),
    content: z.any().optional() as z.ZodOptional<z.ZodType<ReportElements>>, //we use any here because we don't know the type of the content, will be validated in the database
  })
  .partial();

export type UpdateReportRequest = z.infer<typeof UpdateReportRequestSchema>;
export type GetReportsListRequest = z.infer<typeof GetReportsListRequestSchema>;

export const ShareUpdateRequestSchema = z.object({
  publicly_accessible: z.boolean().optional(),
  public_expiry_date: z.string().optional(),
  public_password: z.string().optional(),
  workspace_sharing: WorkspaceSharingSchema.optional(),
});

export type ShareUpdateRequest = z.infer<typeof ShareUpdateRequestSchema>;
