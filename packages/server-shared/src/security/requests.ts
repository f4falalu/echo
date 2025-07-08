import { z } from "zod/v4";
import { OrganizationRoleSchema } from "../organization";

export const UpdateInviteLinkRequestSchema = z.object({
  enabled: z.boolean().optional(),
  refresh_link: z.boolean().optional(),
});

export type UpdateInviteLinkRequest = z.infer<
  typeof UpdateInviteLinkRequestSchema
>;

export const AddApprovedDomainRequestSchema = z.object({
  domains: z.array(z.string()),
});

export type AddApprovedDomainRequest = z.infer<
  typeof AddApprovedDomainRequestSchema
>;

export const RemoveApprovedDomainRequestSchema = z.object({
  domains: z.array(z.string()),
});

export type RemoveApprovedDomainRequest = z.infer<
  typeof RemoveApprovedDomainRequestSchema
>;

export const UpdateWorkspaceSettingsRequestSchema = z.object({
  enabled: z.boolean().optional(),
  default_role: OrganizationRoleSchema.optional(),
  // this can either be a uuid or "all"
  default_datasets_ids: z
    .array(
      z.union([
        z
          .string()
          .regex(
            /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
          ),
        z.literal("all"),
      ])
    )
    .optional(),
});

export type UpdateWorkspaceSettingsRequest = z.infer<
  typeof UpdateWorkspaceSettingsRequestSchema
>;
