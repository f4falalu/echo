import type { QueryClient } from '@tanstack/react-query';
import { prefetchGetDashboard } from '@/api/buster_rest/dashboards';
import { prefetchGetMetric } from '@/api/buster_rest/metrics';
import { prefetchGetReport } from '@/api/buster_rest/reports';

export const createDashboardLoader = async ({
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

export const createReportLoader = async ({
  params: { reportId },
  context: { queryClient },
  deps: { report_version_number },
}: {
  params: { reportId: string };
  deps: { report_version_number?: number };
  context: { queryClient: QueryClient };
}): Promise<{ title: string | undefined }> => {
  const data = await prefetchGetReport(reportId, report_version_number, queryClient);
  return {
    title: data?.name,
  };
};
