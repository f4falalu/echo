import type { slackSharingPermissionEnum } from '@buster/database'; //we import as type to avoid postgres dependency in the frontend ☹️
import { z } from 'zod';

type SlackSharingPermissionBase = (typeof slackSharingPermissionEnum.enumValues)[number];

const SlackSharingPermissionEnum: Record<SlackSharingPermissionBase, SlackSharingPermissionBase> =
  Object.freeze({
    shareWithWorkspace: 'shareWithWorkspace',
    shareWithChannel: 'shareWithChannel',
    noSharing: 'noSharing',
  });

// Error response schema
export const SlackErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
});

export type SlackErrorResponse = z.infer<typeof SlackErrorResponseSchema>;

// POST /api/v2/slack/auth/init
export const InitiateOAuthResponseSchema = z.object({
  auth_url: z.string(),
  state: z.string(),
});

export type InitiateOAuthResponse = z.infer<typeof InitiateOAuthResponseSchema>;

// GET /api/v2/slack/auth/callback
// This endpoint returns a redirect, not JSON

// GET /api/v2/slack/integration
export const GetIntegrationResponseSchema = z.object({
  connected: z.boolean(),
  status: z.enum(['connected', 'disconnected', 're_install_required']).optional(),
  integration: z
    .object({
      id: z.string(),
      team_name: z.string(),
      team_domain: z.string().optional(),
      installed_at: z.string(),
      last_used_at: z.string().optional(),
      default_channel: z
        .object({
          id: z.string(),
          name: z.string(),
        })
        .optional(),
      default_sharing_permissions: z
        .enum(
          Object.values(SlackSharingPermissionEnum) as [
            SlackSharingPermissionBase,
            ...SlackSharingPermissionBase[],
          ]
        )
        .optional(),
    })
    .optional(),
});

export type GetIntegrationResponse = z.infer<typeof GetIntegrationResponseSchema>;

// DELETE /api/v2/slack/integration
export const RemoveIntegrationResponseSchema = z.object({
  message: z.string(),
});

export type RemoveIntegrationResponse = z.infer<typeof RemoveIntegrationResponseSchema>;

// PUT /api/v2/slack/integration
export const UpdateIntegrationResponseSchema = z.object({
  message: z.string(),
  default_channel: z
    .object({
      name: z.string(),
      id: z.string(),
    })
    .optional(),
  default_sharing_permissions: z
    .enum(
      Object.values(SlackSharingPermissionEnum) as [
        SlackSharingPermissionBase,
        ...SlackSharingPermissionBase[],
      ]
    )
    .optional(),
});

export type UpdateIntegrationResponse = z.infer<typeof UpdateIntegrationResponseSchema>;

// GET /api/v2/slack/channels
export const GetChannelsResponseSchema = z.object({
  channels: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    })
  ),
});

export type GetChannelsResponse = z.infer<typeof GetChannelsResponseSchema>;

// OAuth callback result (used internally)
export const OAuthCallbackResultSchema = z.object({
  success: z.boolean(),
  integration_id: z.string(),
  metadata: z
    .object({
      return_url: z.string().optional(),
      source: z.string().optional(),
      project_id: z.string().optional(),
      initiated_at: z.string().optional(),
      ip_address: z.string().optional(),
    })
    .optional(),
  team_name: z.string().optional(),
  error: z.string().optional(),
});

export type OAuthCallbackResult = z.infer<typeof OAuthCallbackResultSchema>;

// Remove integration result (used internally)
export const RemoveIntegrationResultSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

export type RemoveIntegrationResult = z.infer<typeof RemoveIntegrationResultSchema>;

// Example usage for type validation:
// const response: GetIntegrationResponse = GetIntegrationResponseSchema.parse({
//   connected: true,
//   integration: {
//     id: 'integration-123',
//     team_name: 'My Team',
//     team_domain: 'my-team',
//     installed_at: '2025-01-01T00:00:00Z',
//     last_used_at: '2025-01-02T00:00:00Z',
//     default_channel: {
//       id: 'C04RCNXL75J',
//       name: 'general'
//     }
//   }
// });

/**
 * Response schema for Slack events endpoint
 */
export const SlackEventsResponseSchema = z.object({
  success: z.boolean(),
});

export type SlackEventsResponse = z.infer<typeof SlackEventsResponseSchema>;
