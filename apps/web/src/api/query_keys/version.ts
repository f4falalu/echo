import { queryOptions } from '@tanstack/react-query';
import { getAppBuildId } from '@/api/server-functions/getAppVersion';

export const versionGetAppVersion = queryOptions({
  queryKey: ['app-version'] as const,
  queryFn: getAppBuildId,
  refetchInterval: 30000, // 30 seconds
});
