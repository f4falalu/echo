import type { GetS3IntegrationResponse } from '@buster/server-shared/s3-integrations';
import { queryOptions } from '@tanstack/react-query';

export const s3IntegrationGet = queryOptions<GetS3IntegrationResponse>({
  queryKey: ['s3-integrations', 'get'] as const,
});

export const s3IntegrationsList = queryOptions<GetS3IntegrationResponse>({
  queryKey: ['s3-integrations', 'list'] as const,
});

export const s3IntegrationsQueryKeys = {
  s3IntegrationGet,
  s3IntegrationsList,
};
