import { docsTypeEnum } from '@buster/database';
import { z } from 'zod';

export const DocsTypeEnum = z.enum(docsTypeEnum.enumValues);
export type DocsType = z.infer<typeof DocsTypeEnum>;

export const DocSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  content: z.string(),
  type: DocsTypeEnum,
  organizationId: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});

export type Doc = z.infer<typeof DocSchema>;