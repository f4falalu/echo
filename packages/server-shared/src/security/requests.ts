import { z } from 'zod';
import { OrganizationRoleSchema } from '../organization';

export const UpdateInviteLinkRequestSchema = z.object({
  enabled: z.boolean().optional(),
  refresh_link: z.boolean().optional(),
});

export type UpdateInviteLinkRequest = z.infer<typeof UpdateInviteLinkRequestSchema>;

export const AddApprovedDomainRequestSchema = z.object({
  domains: z.array(z.string()),
});

export type AddApprovedDomainRequest = z.infer<typeof AddApprovedDomainRequestSchema>;

export const RemoveApprovedDomainRequestSchema = z.preprocess(
  (input: unknown) => {
    // Handle query string array format (e.g., ?domains[]=example.com&domains[]=test.com)
    if (typeof input === 'object' && input !== null && 'domains[]' in input) {
      const { 'domains[]': domainsArray, ...rest } = input as Record<string, unknown>;

      // Convert domains[] to domains array
      if (Array.isArray(domainsArray)) {
        return { ...rest, domains: domainsArray };
      }
      if (typeof domainsArray === 'string') {
        return { ...rest, domains: [domainsArray] };
      }

      return { ...rest, domains: [] };
    }
    return input;
  },
  z.object({
    domains: z.array(z.string()),
  })
);

export type RemoveApprovedDomainRequest = z.infer<typeof RemoveApprovedDomainRequestSchema>;

export const UpdateWorkspaceSettingsRequestSchema = z.object({
  restrict_new_user_invitations: z.boolean().optional(),
  default_role: OrganizationRoleSchema.optional(),
  // this can either be a uuid or "all"
  default_datasets_ids: z.array(z.union([z.string(), z.literal('all')])).optional(),
});

export type UpdateWorkspaceSettingsRequest = z.infer<typeof UpdateWorkspaceSettingsRequestSchema>;
