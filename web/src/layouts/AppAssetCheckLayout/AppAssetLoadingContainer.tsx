'use client';

import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';
import { FileIndeterminateLoader } from '@/components/features/FileIndeterminateLoader';
import React, { useMemo } from 'react';

export const AppAssetLoadingContainer: React.FC<{
  assetId: string;
  type: 'metric' | 'dashboard';
  children: React.ReactNode;
  versionNumber: number | undefined;
}> = React.memo(({ assetId, type, children, versionNumber }) => {
  const {
    isFetchedConfig: isFetchedMetricConfig,
    isFetchedData: isFetchedMetricData,
    error: metricError
  } = useGetMetricAssetData({
    assetId,
    enabled: type === 'metric',
    versionNumber
  });
  const {
    isFetchedConfig: isFetchedDashboardConfig,
    isFetchedData: isFetchedDashboardData,
    error: dashboardError
  } = useGetDashboardAssetData({
    assetId,
    enabled: type === 'dashboard',
    versionNumber
  });

  const showLoader = useMemo(() => {
    if (type === 'metric') {
      return (!isFetchedMetricConfig || !isFetchedMetricData) && !metricError;
    }

    if (type === 'dashboard') {
      return (!isFetchedDashboardConfig || !isFetchedDashboardData) && !dashboardError;
    }

    return true;
  }, [
    isFetchedMetricConfig,
    isFetchedMetricData,
    isFetchedDashboardConfig,
    isFetchedDashboardData,
    metricError,
    dashboardError,
    type
  ]);

  return (
    <>
      {showLoader && <FileIndeterminateLoader />}
      {children}
    </>
  );
});

AppAssetLoadingContainer.displayName = 'AppAssetLoadingContainer';

const useGetMetricAssetData = ({
  assetId,
  enabled,
  versionNumber
}: {
  assetId: string;
  enabled: boolean;
  versionNumber: number | undefined;
}) => {
  const { isFetched: isMetricFetched, ...rest } = useGetMetric({
    id: enabled ? assetId : undefined,
    versionNumber
  });
  const { isFetched: isMetricDataFetched } = useGetMetricData({
    id: enabled ? assetId : undefined,
    versionNumber
  });

  return {
    isFetchedConfig: isMetricFetched,
    isFetchedData: isMetricDataFetched,
    error: rest.error
  };
};

const useGetDashboardAssetData = ({
  assetId,
  enabled,
  versionNumber
}: {
  assetId: string;
  enabled: boolean;
  versionNumber: number | undefined;
}) => {
  const { isFetched: isDashboardFetched, error: dashboardError } = useGetDashboard({
    id: enabled ? assetId : undefined,
    versionNumber
  });

  return {
    isFetchedConfig: isDashboardFetched,
    isFetchedData: isDashboardFetched,
    error: dashboardError
  };
};
