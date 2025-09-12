import { z } from 'zod';

export const shortcutSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  instructions: z.string(),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid().nullable(),
  organizationId: z.string().uuid(),
  shareWithWorkspace: z.boolean(),
  createdAt: z.string(), // ISO string
  updatedAt: z.string(), // ISO string
  deletedAt: z.string().nullable(), // ISO string or null
});

export const listShortcutsResponseSchema = z.object({
  shortcuts: z.array(shortcutSchema),
});

export const shortcutErrorSchema = z.object({
  code: z.enum(['DUPLICATE_NAME', 'NOT_FOUND', 'PERMISSION_DENIED']),
  message: z.string(),
});

// Export types inferred from schemas
export type Shortcut = z.infer<typeof shortcutSchema>;
export type ListShortcutsResponse = z.infer<typeof listShortcutsResponseSchema>;
export type ShortcutError = z.infer<typeof shortcutErrorSchema>;
