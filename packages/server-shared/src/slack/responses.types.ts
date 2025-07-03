// Error response type
export interface SlackErrorResponse {
  error: string;
  code?: string;
}

// POST /api/v2/slack/auth/init
export interface InitiateOAuthResponse {
  authUrl: string;
  state: string;
}

// GET /api/v2/slack/auth/callback
// This endpoint returns a redirect, not JSON

// GET /api/v2/slack/integration
export interface GetIntegrationResponse {
  connected: boolean;
  integration?: {
    id: string;
    teamName: string;
    teamDomain?: string;
    installedAt: string;
    lastUsedAt?: string;
  };
}

// DELETE /api/v2/slack/integration
export interface RemoveIntegrationResponse {
  message: string;
}

// PUT /api/v2/slack/integration
export interface UpdateIntegrationResponse {
  message: string;
  default_channel?: {
    name: string;
    id: string;
  };
}

// GET /api/v2/slack/channels
export interface GetChannelsResponse {
  channels: Array<{
    id: string;
    name: string;
  }>;
}

// OAuth callback result (used internally)
export interface OAuthCallbackResult {
  success: boolean;
  integrationId: string;
  metadata?: {
    returnUrl?: string;
    source?: string;
    projectId?: string;
    initiatedAt?: string;
    ipAddress?: string;
  };
  teamName?: string;
  error?: string;
}

// Remove integration result (used internally)
export interface RemoveIntegrationResult {
  success: boolean;
  error?: string;
}
