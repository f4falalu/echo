import type { AssetType } from '@buster/server-shared/assets';
import type { QueryClient } from '@tanstack/react-query';
import { Outlet } from '@tanstack/react-router';
import { z } from 'zod';
import { prefetchGetDashboard } from '@/api/buster_rest/dashboards';
import { useGetDashboardParams } from '@/context/Dashboards/useGetDashboardParams';
import { DashboardAssetContainer } from '@/layouts/AssetContainer/DashboardAssetContainer/DashboardAssetContainer';

export const validateSearch = z.object({
  dashboard_version_number: z.coerce.number().optional(),
});

export const staticData = {
  assetType: 'dashboard_file' as AssetType,
};

export const beforeLoad = ({ search }: { search: { dashboard_version_number?: number } }) => {
  return {
    dashboard_version_number: search.dashboard_version_number,
  };
};

export const loader = async ({
  params: { dashboardId },
  context: { queryClient, dashboard_version_number },
}: {
  params: { dashboardId: string; chatId?: string };
  context: { queryClient: QueryClient; dashboard_version_number?: number };
}): Promise<{ title: string | undefined }> => {
  const data = await prefetchGetDashboard({
    queryClient,
    id: dashboardId,
    version_number: dashboard_version_number,
  });
  return {
    title: data?.dashboard?.name,
  };
};

export const head = ({ loaderData }: { loaderData?: { title: string | undefined } } = {}) => ({
  meta: [
    { title: loaderData?.title || 'Dashboard' },
    { name: 'description', content: 'View and interact with your dashboard' },
    { name: 'og:title', content: 'Dashboard' },
    { name: 'og:description', content: 'View and interact with your dashboard' },
  ],
});

export const component = () => {
  const params = useGetDashboardParams();
  return (
    <DashboardAssetContainer {...params}>
      <Outlet />
    </DashboardAssetContainer>
  );
};

export const ssr = false;
