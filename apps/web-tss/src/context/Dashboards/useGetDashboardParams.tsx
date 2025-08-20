import { useParams, useParentMatches, useSearch } from '@tanstack/react-router';
import { useMemo } from 'react';

const stableDashboardParams = (params?: { dashboardId?: string }) => ({
  dashboardId: params?.dashboardId || '',
});
const stableDashboardSearch = (search?: { dashboard_version_number?: number }) => ({
  dashboard_version_number: search?.dashboard_version_number || ('LATEST' as const),
});

export const useGetDashboardParams = () => {
  const { dashboardId } = useParams({
    strict: false,
    select: stableDashboardParams,
  });
  const { dashboard_version_number } = useSearch({
    strict: false,
    select: stableDashboardSearch,
  });

  return useMemo(
    () => ({
      dashboardId,
      dashboardVersionNumber: dashboard_version_number,
    }),
    [dashboardId, dashboard_version_number]
  );
};
