// Error response type
export interface SlackErrorResponse {
  error: string;
  code?: string;
}

// POST /api/v2/slack/auth/init
export interface InitiateOAuthResponse {
  auth_url: string;
  state: string;
}

// GET /api/v2/slack/auth/callback
// This endpoint returns a redirect, not JSON

// GET /api/v2/slack/integration
export interface GetIntegrationResponse {
  connected: boolean;
  integration?: {
    id: string;
    team_name: string;
    team_domain?: string;
    installed_at: string;
    last_used_at?: string;
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
  integration_id: string;
  metadata?: {
    return_url?: string;
    source?: string;
    project_id?: string;
    initiated_at?: string;
    ip_address?: string;
  };
  team_name?: string;
  error?: string;
}

// Remove integration result (used internally)
export interface RemoveIntegrationResult {
  success: boolean;
  error?: string;
}
