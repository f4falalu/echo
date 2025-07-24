import { z } from 'zod';
import { AssetTypeSchema } from '../assets/asset-types.types';

export const ShareRoleSchema = z.enum([
  'owner', //owner of the asset
  'fullAccess', //same as owner, can share with others
  'canEdit', //can edit, cannot share
  'canView', //can view asset
]);

export const WorkspaceShareRoleSchema = z.enum([...ShareRoleSchema.options, 'none']);

export const ShareAssetTypeSchema = AssetTypeSchema;

export const ShareIndividualSchema = z.object({
  email: z.string(),
  role: ShareRoleSchema,
  name: z.string().optional(),
  avatar_url: z.string().nullable().optional(),
});

export const ShareConfigSchema = z.object({
  individual_permissions: z.array(ShareIndividualSchema).nullable(),
  public_expiry_date: z.string().nullable(),
  public_enabled_by: z.string().nullable(),
  publicly_accessible: z.boolean(),
  public_password: z.string().nullable(),
  permission: ShareRoleSchema, //this is the permission the user has to the metric, dashboard or collection
  workspace_sharing: WorkspaceShareRoleSchema.nullable(),
  workspace_member_count: z.number().nullable(),
});

// Export the inferred types
export type ShareRole = z.infer<typeof ShareRoleSchema>;
export type WorkspaceShareRole = z.infer<typeof WorkspaceShareRoleSchema>;
export type ShareAssetType = z.infer<typeof ShareAssetTypeSchema>;
export type ShareIndividual = z.infer<typeof ShareIndividualSchema>;
export type ShareConfig = z.infer<typeof ShareConfigSchema>;
