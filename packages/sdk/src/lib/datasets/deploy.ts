import type { DeployRequest, DeployResponse } from '@buster/server-shared';
import type { SDKConfig } from '../config';
import { post } from '../http';

/**
 * Deploy semantic models to the Buster API
 * Performs upserts on all models and soft-deletes models not included
 */
export async function deployDatasets(
  config: SDKConfig,
  request: DeployRequest
): Promise<DeployResponse> {
  return post<DeployResponse>(config, '/api/v2/datasets/deploy', request);
}

/**
 * Get datasets for the current organization
 */
export async function getDatasets(
  config: SDKConfig,
  dataSourceId?: string
): Promise<{ datasets: unknown[] }> {
  const path = dataSourceId ? `/api/v2/datasets?dataSourceId=${dataSourceId}` : '/api/v2/datasets';

  const response = await fetch(new URL(path, config.apiUrl).toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
      ...config.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get datasets: ${response.statusText}`);
  }

  return response.json() as Promise<{ datasets: unknown[] }>;
}
