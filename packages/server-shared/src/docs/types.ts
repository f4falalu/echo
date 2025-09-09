import type { docsTypeEnum } from '@buster/database';
import { z } from 'zod';

type DocsTypeBase = (typeof docsTypeEnum.enumValues)[number];

const DocsTypeEnums: Record<DocsTypeBase, DocsTypeBase> = Object.freeze({
  analyst: 'analyst',
  normal: 'normal',
});

export const DocsTypeEnum = z.enum(
  Object.values(DocsTypeEnums) as [DocsTypeBase, ...DocsTypeBase[]]
);

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
