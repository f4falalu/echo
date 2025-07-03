import { z } from 'zod';

// POST /api/v2/slack/auth/init
export const InitiateOAuthSchema = z.object({
  metadata: z
    .object({
      returnUrl: z.string().optional(),
      source: z.string().optional(),
      projectId: z.string().uuid().optional(),
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
  returnUrl: z.string().optional(),
  source: z.string().optional(),
  projectId: z.string().uuid().optional(),
  initiatedAt: z.string().datetime().optional(),
  ipAddress: z.string().optional(),
});

export type OAuthMetadata = z.infer<typeof OAuthMetadataSchema>;
