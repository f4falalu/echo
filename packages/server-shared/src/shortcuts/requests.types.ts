import { z } from 'zod';

// Shortcut name validation: lowercase letters, numbers, and hyphens only
export const shortcutNameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(255, 'Name must be 255 characters or less')
  .regex(/^[a-z][a-z0-9-]*$/, {
    message:
      'Name must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens',
  })
  .refine((name) => !name.includes('--'), {
    message: 'Name cannot contain consecutive hyphens',
  });

export const createShortcutRequestSchema = z.object({
  name: shortcutNameSchema,
  instructions: z
    .string()
    .min(1, 'Instructions are required')
    .max(10000, 'Instructions must be 10,000 characters or less'),
  sharedWithWorkspace: z.boolean(),
});

export const updateShortcutRequestSchema = z.object({
  name: shortcutNameSchema.optional(),
  instructions: z
    .string()
    .min(1, 'Instructions are required')
    .max(10000, 'Instructions must be 10,000 characters or less')
    .optional(),
});

// Export types inferred from schemas
export type CreateShortcutRequest = z.infer<typeof createShortcutRequestSchema>;
export type UpdateShortcutRequest = z.infer<typeof updateShortcutRequestSchema>;
