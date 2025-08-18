'use client';

import type { AssetType } from '@buster/server-shared/assets';
import { useMemo } from 'react';
import { useGetCollection } from '@/api/buster_rest/collections';
import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';
import { useGetReport } from '@/api/buster_rest/reports';
import type { RustApiError } from '@/api/errors';

type AssetProps = {
  assetId: string;
  type: Exclude<AssetType, 'chat' | 'collection'>;
  versionNumber?: number;
};

type ParentAssetProps = {
  assetId: string;
  type: Extract<AssetType, 'chat' | 'collection'>;
  versionNumber: never;
};

export type UseGetAssetProps = AssetProps | ParentAssetProps;

interface AssetAccess {
  hasAccess: boolean;
  passwordRequired: boolean;
  isPublic: boolean;
  isDeleted: boolean;
}

interface AssetQueryResult {
  isFetched: boolean;
  error: RustApiError | null;
  isError?: boolean;
  showLoader?: boolean;
}

const getAssetAccess = (error: RustApiError | null): AssetAccess => {
  if (!error) {
    return { hasAccess: true, passwordRequired: false, isPublic: false, isDeleted: false };
  }

  if (error.status === 418) {
    return { hasAccess: false, passwordRequired: true, isPublic: true, isDeleted: false };
  }

  if (error.status === 410) {
    return { hasAccess: false, passwordRequired: false, isPublic: false, isDeleted: true };
  }

  return { hasAccess: false, passwordRequired: false, isPublic: false, isDeleted: false };
};

const useVersionNumber = (props: UseGetAssetProps) => {
  if (props.versionNumber !== undefined) {
    return props.versionNumber;
  }

  return undefined;
};

export const useGetAsset = (
  props: UseGetAssetProps
): {
  isFetched: boolean;
  error: RustApiError | null;
  hasAccess: boolean;
  passwordRequired: boolean;
  isPublic: boolean;
  showLoader: boolean | undefined;
  title: string | undefined;
} => {
  const versionNumber = useVersionNumber(props);
  const isMetric = props.type === 'metric';
  const isDashboard = props.type === 'dashboard';
  const isCollection = props.type === 'collection';
  const isReport = props.type === 'report';
  const hasAssetId = props.assetId !== undefined;

  // Always call hooks at the top level with appropriate enabled flags
  const {
    error: metricError,
    isFetched: metricIsFetched,
    data: metricTitle,
  } = useGetMetric(
    {
      id: isMetric ? props.assetId : undefined,
      versionNumber,
    },
    {
      enabled: isMetric && hasAssetId,
      select: (x) => x?.name,
      staleTime: Infinity,
    }
  );

  const { isFetched: metricDataIsFetched } = useGetMetricData({
    id: isMetric ? props.assetId : undefined,
    versionNumber,
  });

  const {
    isFetched: dashboardIsFetched,
    error: dashboardError,
    isError: dashboardIsError,
    data: dashboardTitle,
  } = useGetDashboard(
    {
      id: isDashboard ? props.assetId : undefined,
      versionNumber,
    },
    { enabled: isDashboard && hasAssetId, select: (x) => x?.dashboard?.name, staleTime: Infinity }
  );

  const {
    isFetched: reportIsFetched,
    error: reportError,
    isError: reportIsError,
    data: reportTitle,
  } = useGetReport(
    { reportId: isReport ? props.assetId : undefined, versionNumber },
    { select: (x) => x?.name, enabled: isReport && hasAssetId }
  );

  const {
    isFetched: collectionIsFetched,
    error: collectionError,
    isError: collectionIsError,
    data: collectionTitle,
  } = useGetCollection(isCollection ? props.assetId : undefined, {
    select: (x) => x?.name,
    enabled: isCollection && hasAssetId,
  });

  const currentQuery = useMemo((): AssetQueryResult => {
    switch (props.type) {
      case 'metric':
        return {
          isFetched: metricIsFetched,
          error: metricError,
          isError: !!metricError,
          showLoader: !metricDataIsFetched && !metricError && !metricIsFetched,
        };
      case 'dashboard':
        return {
          isFetched: dashboardIsFetched,
          error: dashboardError,
          isError: dashboardIsError,
          showLoader: !dashboardIsFetched && !dashboardIsError,
        };
      case 'collection':
        return {
          isFetched: collectionIsFetched,
          error: collectionError,
          isError: collectionIsError,
          showLoader: !collectionIsFetched && !collectionIsError,
        };

      case 'report':
        return {
          isFetched: reportIsFetched,
          error: reportError,
          isError: reportIsError,
          showLoader: !reportIsFetched && !reportIsError,
        };
      case 'chat':
        // Chat type is not supported in this hook
        return { isFetched: true, error: null, isError: false, showLoader: false };
      default: {
        const exhaustiveCheck: never = props;
        return { isFetched: false, error: null, isError: false, showLoader: false };
      }
    }
  }, [
    props.type,
    metricIsFetched,
    metricError,
    metricDataIsFetched,
    dashboardIsFetched,
    dashboardError,
    dashboardIsError,
    collectionIsFetched,
    collectionError,
    collectionIsError,
    reportIsFetched,
    reportError,
    reportIsError,
  ]);

  const title = useMemo(() => {
    if (isMetric) return metricTitle;
    if (isDashboard) return dashboardTitle;
    if (isCollection) return collectionTitle;
    if (isReport) return reportTitle;
    return undefined;
  }, [
    isMetric,
    isDashboard,
    isCollection,
    isReport,
    metricTitle,
    dashboardTitle,
    collectionTitle,
    reportTitle,
  ]);

  const { hasAccess, passwordRequired, isPublic } = getAssetAccess(currentQuery.error);

  return {
    isFetched: currentQuery.isFetched,
    error: currentQuery.error,
    hasAccess,
    passwordRequired,
    isPublic,
    showLoader: currentQuery.showLoader,
    title,
  };
};
