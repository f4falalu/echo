import type {
  GetIntegrationResponse,
  GetChannelsResponse
} from '@buster/server-shared/slack';
import { queryOptions } from '@tanstack/react-query';

export const slackGetIntegration = queryOptions<GetIntegrationResponse>({
  queryKey: ['slack', 'integration']
});

export const slackGetChannels = queryOptions<GetChannelsResponse>({
  queryKey: ['slack', 'channels']
});

export const slackQueryKeys = {
  slackGetIntegration,
  slackGetChannels
}; 