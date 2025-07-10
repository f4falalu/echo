import { z } from 'zod';
import { OrganizationRoleSchema } from '../organization';

export const GetInviteLinkResponseSchema = z.object({
  link: z.string(),
  enabled: z.boolean(),
});
export const UpdateInviteLinkResponseSchema = GetInviteLinkResponseSchema;
export const RefreshInviteLinkResponseSchema = GetInviteLinkResponseSchema;

export const GetApprovedDomainsResponseSchema = z.array(
  z.object({
    domain: z.string(),
    created_at: z.string(),
  })
);
export const AddApprovedDomainsResponseSchema = GetApprovedDomainsResponseSchema;
export const UpdateApprovedDomainsResponseSchema = GetApprovedDomainsResponseSchema;
export const RemoveApprovedDomainsResponseSchema = GetApprovedDomainsResponseSchema;

export const GetWorkspaceSettingsResponseSchema = z.object({
  restrict_new_user_invitations: z.boolean(),
  default_role: OrganizationRoleSchema,
  default_datasets: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    })
  ),
});
export const UpdateWorkspaceSettingsResponseSchema = GetWorkspaceSettingsResponseSchema;

export type RefreshInviteLinkResponse = z.infer<typeof RefreshInviteLinkResponseSchema>;
export type UpdateInviteLinkResponse = z.infer<typeof UpdateInviteLinkResponseSchema>;
export type GetInviteLinkResponse = z.infer<typeof GetInviteLinkResponseSchema>;
export type GetApprovedDomainsResponse = z.infer<typeof GetApprovedDomainsResponseSchema>;
export type AddApprovedDomainsResponse = z.infer<typeof AddApprovedDomainsResponseSchema>;
export type UpdateApprovedDomainsResponse = z.infer<typeof UpdateApprovedDomainsResponseSchema>;
export type RemoveApprovedDomainsResponse = z.infer<typeof RemoveApprovedDomainsResponseSchema>;
export type GetWorkspaceSettingsResponse = z.infer<typeof GetWorkspaceSettingsResponseSchema>;
export type UpdateWorkspaceSettingsResponse = z.infer<typeof UpdateWorkspaceSettingsResponseSchema>;
