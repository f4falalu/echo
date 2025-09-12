import type { HealthCheckResponse } from '@buster/server-shared/healthcheck';
import { mainApiV2 } from '../instances';

export const getHealthcheck = async () => {
  return await mainApiV2.get<HealthCheckResponse>('/healthcheck').then((res) => res.data);
};
