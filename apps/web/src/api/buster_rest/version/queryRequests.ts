import { useQuery } from '@tanstack/react-query';
import { getAppBuildId } from '@/api/server-functions/getAppVersion';

export const useGetAppBuildId = () => {
  return useQuery({
    queryKey: ['app-version'] as const,
    queryFn: getAppBuildId,
  });
};
