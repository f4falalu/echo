import { z } from 'zod';
import { ShareRoleSchema, WorkspaceShareRoleSchema } from './share-interfaces.types';

export const SharePostRequestSchema = z.array(
  z.object({
    email: z.string().email(),
    role: ShareRoleSchema,
    avatar_url: z.string().nullable().optional(),
    name: z.string().optional(),
  })
);

export type SharePostRequest = z.infer<typeof SharePostRequestSchema>;

//Used for updating share permissions for a report, collection, or metric
export const SharePermissionsUpdateRequestSchema = z.object({
  publicly_accessible: z.boolean().optional(),
  public_expiry_date: z.string().nullable().optional(),
  public_password: z.string().nullable().optional(),
  workspace_sharing: WorkspaceShareRoleSchema.optional(),
  users: z
    .array(
      z.object({
        email: z.string(),
        role: ShareRoleSchema,
      })
    )
    .optional(),
});

export type SharePermissionsUpdateRequest = z.infer<typeof SharePermissionsUpdateRequestSchema>;

// Keep old names for backward compatibility but don't export from index
const _ShareUpdateRequestSchema = SharePermissionsUpdateRequestSchema;
type _ShareUpdateRequest = SharePermissionsUpdateRequest;

//Used for deleting share permissions for a report, collection, or metric
export const ShareDeleteRequestSchema = z.array(z.string());

export type ShareDeleteRequest = z.infer<typeof ShareDeleteRequestSchema>;
