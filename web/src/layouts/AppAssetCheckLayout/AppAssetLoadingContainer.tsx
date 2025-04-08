'use client';

import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { FileIndeterminateLoader } from '@/components/features/FileIndeterminateLoader';
import { useMount } from '@/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';

export const AppAssetLoadingContainer: React.FC<{
  assetId: string;
  type: 'metric' | 'dashboard';
  children: React.ReactNode;
}> = React.memo(({ assetId, type, children }) => {
  const {
    isFetchedConfig: isFetchedMetricConfig,
    isFetchedData: isFetchedMetricData,
    error: metricError
  } = useGetMetricAssetData({
    assetId,
    enabled: type === 'metric'
  });
  const {
    isFetchedConfig: isFetchedDashboardConfig,
    isFetchedData: isFetchedDashboardData,
    error: dashboardError
  } = useGetDashboardAssetData({
    assetId,
    enabled: type === 'dashboard'
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

const useGetMetricAssetData = ({ assetId, enabled }: { assetId: string; enabled: boolean }) => {
  const { isFetched: isMetricFetched, ...rest } = useGetMetric({
    id: enabled ? assetId : undefined
  });
  const { isFetched: isMetricDataFetched } = useGetMetricData({
    id: enabled ? assetId : undefined
  });

  return {
    isFetchedConfig: isMetricFetched,
    isFetchedData: isMetricDataFetched,
    error: rest.error
  };
};

const useGetDashboardAssetData = ({ assetId, enabled }: { assetId: string; enabled: boolean }) => {
  const { isFetched: isDashboardFetched, error: dashboardError } = useGetDashboard({
    id: enabled ? assetId : undefined
  });

  return {
    isFetchedConfig: isDashboardFetched,
    isFetchedData: isDashboardFetched,
    error: dashboardError
  };
};
