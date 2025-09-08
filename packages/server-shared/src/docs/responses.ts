import { z } from 'zod';
import { DocSchema } from './types';

export const GetDocResponseSchema = DocSchema;

export const CreateDocResponseSchema = DocSchema;

export const UpdateDocResponseSchema = DocSchema;

export const DeleteDocResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const GetDocsListResponseSchema = z.object({
  data: z.array(DocSchema),
  total: z.number(),
  page: z.number(),
  page_size: z.number(),
  total_pages: z.number(),
});

export type GetDocResponse = z.infer<typeof GetDocResponseSchema>;
export type CreateDocResponse = z.infer<typeof CreateDocResponseSchema>;
export type UpdateDocResponse = z.infer<typeof UpdateDocResponseSchema>;
export type DeleteDocResponse = z.infer<typeof DeleteDocResponseSchema>;
export type GetDocsListResponse = z.infer<typeof GetDocsListResponseSchema>;
