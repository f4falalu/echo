import type { AssetType } from '@buster/server-shared/assets';
import type { QueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { prefetchGetDashboard } from '@/api/buster_rest/dashboards';

export const validateSearch = z.object({
  dashboard_version_number: z.coerce.number().optional(),
});

export const loader = async ({
  params: { dashboardId },
  context: { queryClient },
  deps: { dashboard_version_number },
}: {
  params: { dashboardId: string };
  deps: { dashboard_version_number?: number };
  context: { queryClient: QueryClient };
}): Promise<{ title: string | undefined }> => {
  const data = await prefetchGetDashboard(dashboardId, dashboard_version_number, queryClient);
  return {
    title: data?.dashboard?.name,
  };
};

export const staticData = {
  assetType: 'dashboard' as AssetType,
};

export const head = ({ loaderData }: { loaderData?: { title: string | undefined } } = {}) => ({
  meta: [
    { title: loaderData?.title || 'Dashboard' },
    { name: 'description', content: 'View and interact with your dashboard' },
    { name: 'og:title', content: 'Dashboard' },
    { name: 'og:description', content: 'View and interact with your dashboard' },
  ],
});
