import { z } from 'zod';
import { PaginatedRequestSchema } from '../type-utilities/pagination';
import { DocsTypeEnum } from './types';

export const CreateDocRequestSchema = z.object({
  name: z.string().min(1).max(255),
  content: z.string(),
  type: DocsTypeEnum,
});

export const UpdateDocRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
  type: DocsTypeEnum.optional(),
});

export const GetDocsListRequestSchema = PaginatedRequestSchema.extend({
  type: DocsTypeEnum.optional(),
  search: z.string().optional(),
});

export const GetDocByIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export type CreateDocRequest = z.infer<typeof CreateDocRequestSchema>;
export type UpdateDocRequest = z.infer<typeof UpdateDocRequestSchema>;
export type GetDocsListRequest = z.infer<typeof GetDocsListRequestSchema>;
export type GetDocByIdParams = z.infer<typeof GetDocByIdParamsSchema>;
