import { z } from 'zod';

// POST /api/v2/slack/auth/init
export const InitiateOAuthSchema = z.object({
  metadata: z
    .object({
      return_url: z.string().optional(),
      source: z.string().optional(),
      project_id: z.string().uuid().optional(),
    })
    .optional(),
});

export type InitiateOAuthRequest = z.infer<typeof InitiateOAuthSchema>;

// GET /api/v2/slack/auth/callback
export const OAuthCallbackSchema = z.object({
  code: z.string(),
  state: z.string(),
});

export type OAuthCallbackRequest = z.infer<typeof OAuthCallbackSchema>;

// PUT /api/v2/slack/integration
export const UpdateIntegrationSchema = z.object({
  default_channel: z
    .object({
      name: z.string().min(1),
      id: z.string().min(1),
    })
    .optional(),
});

export type UpdateIntegrationRequest = z.infer<typeof UpdateIntegrationSchema>;

// OAuth metadata schema (used internally)
export const OAuthMetadataSchema = z.object({
  return_url: z.string().optional(),
  source: z.string().optional(),
  project_id: z.string().uuid().optional(),
  initiated_at: z.string().datetime().optional(),
  ip_address: z.string().optional(),
});

export type OAuthMetadata = z.infer<typeof OAuthMetadataSchema>;
