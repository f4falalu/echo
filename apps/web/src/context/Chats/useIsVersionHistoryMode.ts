import type { AssetType } from '@buster/server-shared/assets';
import type { GetDashboardResponse } from '@buster/server-shared/dashboards';
import type { GetMetricResponse } from '@buster/server-shared/metrics';
import type { GetReportResponse } from '@buster/server-shared/reports';
import { useQuery } from '@tanstack/react-query';
import last from 'lodash/last';
import { useMemo } from 'react';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { reportsQueryKeys } from '@/api/query_keys/reports';
import { useGetDashboardParams } from '../Dashboards/useGetDashboardParams';
import { useGetMetricParams } from '../Metrics/useGetMetricParams';
import { useGetReportParams } from '../Reports/useGetReportParams';

const stableSelect = (v: GetDashboardResponse | GetMetricResponse | GetReportResponse): boolean => {
  const latestVersion = last(v.versions)?.version_number;
  if ('dashboard' in v) {
    return v.dashboard.version_number !== latestVersion;
  }
  return latestVersion !== v.version_number;
};

export const useChatIsVersionHistoryMode = ({
  type,
}: {
  type: Extract<AssetType, 'dashboard_file' | 'report_file' | 'metric_file'>;
}) => {
  const { metricId, metricVersionNumber } = useGetMetricParams();
  const { dashboardId, dashboardVersionNumber } = useGetDashboardParams();
  const { reportId, reportVersionNumber } = useGetReportParams();

  const query = useMemo(() => {
    switch (type) {
      case 'dashboard_file':
        return dashboardQueryKeys.dashboardGetDashboard(
          dashboardId,
          dashboardVersionNumber || 'LATEST'
        );
      case 'report_file':
        return reportsQueryKeys.reportsGetReport(reportId, reportVersionNumber || 'LATEST');
      case 'metric_file':
        return metricsQueryKeys.metricsGetMetric(metricId, metricVersionNumber || 'LATEST');
    }
  }, [
    type,
    dashboardId,
    dashboardVersionNumber,
    metricId,
    metricVersionNumber,
    reportId,
    reportVersionNumber,
  ]);

  const { data: isVersionHistoryMode } = useQuery({
    queryKey: query?.queryKey,
    enabled: false,
    select: stableSelect,
    notifyOnChangeProps: ['data'],
  });

  return !!isVersionHistoryMode;
};
