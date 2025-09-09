import { z } from 'zod';

// Direct enum creation without unsafe type assertion
// Values match the database enum: pgEnum('docs_type_enum', ['analyst', 'normal'])
export const DocsTypeEnum = z.enum(['analyst', 'normal']);

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
