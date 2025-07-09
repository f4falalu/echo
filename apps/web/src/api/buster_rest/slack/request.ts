import { mainApiV2 } from '../instances';
import type {
  InitiateOAuthRequest,
  UpdateIntegrationRequest,
  InitiateOAuthResponse,
  GetIntegrationResponse,
  RemoveIntegrationResponse,
  UpdateIntegrationResponse,
  GetChannelsResponse
} from '@buster/server-shared/slack';

// POST /api/v2/slack/auth/init
export const initiateSlackOAuth = async (data: InitiateOAuthRequest) => {
  return mainApiV2.post<InitiateOAuthResponse>('/slack/auth/init', data).then((res) => res.data);
};

// GET /api/v2/slack/integration
export const getSlackIntegration = async () => {
  return mainApiV2.get<GetIntegrationResponse>('/slack/integration').then((res) => res.data);
};

// DELETE /api/v2/slack/integration
export const removeSlackIntegration = async () => {
  return mainApiV2.delete<RemoveIntegrationResponse>('/slack/integration').then((res) => res.data);
};

// PUT /api/v2/slack/integration
export const updateSlackIntegration = async (data: UpdateIntegrationRequest) => {
  return mainApiV2.put<UpdateIntegrationResponse>('/slack/integration', data).then((res) => res.data);
};

// GET /api/v2/slack/channels
export const getSlackChannels = async () => {
  return mainApiV2.get<GetChannelsResponse>('/slack/channels').then((res) => res.data);
};
