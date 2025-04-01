'use client';

import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';
import { FileIndeterminateLoader } from '@/components/features/FileIndeterminateLoader';
import React, { useMemo } from 'react';

export const AppAssetLoadingContainer: React.FC<{
  assetId: string;
  type: 'metric' | 'dashboard';
  children: React.ReactNode;
}> = React.memo(({ assetId, type, children }) => {
  const { isFetchedConfig: isFetchedMetricConfig, isFetchedData: isFetchedMetricData } =
    useGetMetricAssetData({
      assetId,
      enabled: type === 'metric'
    });
  const { isFetchedConfig: isFetchedDashboardConfig, isFetchedData: isFetchedDashboardData } =
    useGetDashboardAssetData({
      assetId,
      enabled: type === 'dashboard'
    });

  const showLoader = useMemo(() => {
    if (type === 'metric') {
      return !isFetchedMetricConfig || !isFetchedMetricData;
    }

    if (type === 'dashboard') {
      return !isFetchedDashboardConfig || !isFetchedDashboardData;
    }

    return true;
  }, [
    isFetchedMetricConfig,
    isFetchedMetricData,
    isFetchedDashboardConfig,
    isFetchedDashboardData,
    type
  ]);

  const isFetchedConfig = useMemo(() => {
    if (type === 'metric') {
      return isFetchedMetricConfig;
    }

    return isFetchedDashboardConfig;
  }, [isFetchedMetricConfig, isFetchedDashboardConfig, type]);

  return (
    <>
      {showLoader && <FileIndeterminateLoader />}
      {isFetchedConfig && children}
    </>
  );
});

AppAssetLoadingContainer.displayName = 'AppAssetLoadingContainer';

const useGetMetricAssetData = ({ assetId, enabled }: { assetId: string; enabled: boolean }) => {
  const { isFetched: isMetricFetched } = useGetMetric({
    id: enabled ? assetId : undefined
  });
  const { isFetched: isMetricDataFetched } = useGetMetricData({
    id: enabled ? assetId : undefined
  });

  return {
    isFetchedConfig: isMetricFetched,
    isFetchedData: isMetricDataFetched
  };
};

const useGetDashboardAssetData = ({ assetId, enabled }: { assetId: string; enabled: boolean }) => {
  const { isFetched: isDashboardFetched } = useGetDashboard({
    id: enabled ? assetId : undefined
  });

  return {
    isFetchedConfig: isDashboardFetched,
    isFetchedData: isDashboardFetched
  };
};
