'use client';

import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useParams, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { FileViewSecondary } from './useLayoutConfig';

export const useGetChatParams = () => {
  const {
    chatId,
    versionNumber: versionNumberPath,
    metricId,
    dashboardId,
    collectionId,
    datasetId,
    messageId
  } = useParams() as {
    versionNumber: string | undefined;
    chatId: string | undefined;
    metricId: string | undefined;
    dashboardId: string | undefined;
    collectionId: string | undefined;
    datasetId: string | undefined;
    messageId: string | undefined;
  };
  const searchParams = useSearchParams();
  const queryMetricVersionNumber = searchParams.get('metric_version_number');
  const queryDashboardVersionNumber = searchParams.get('dashboard_version_number');
  const secondaryView = searchParams.get('secondary_view') as FileViewSecondary | undefined;
  const currentRoute = useAppLayoutContextSelector((x) => x.currentRoute);

  const metricVersionNumber = useMemo(() => {
    if (!metricId) return undefined;
    if (versionNumberPath) return parseInt(versionNumberPath);
    if (queryMetricVersionNumber) return parseInt(queryMetricVersionNumber);
    return undefined;
  }, [versionNumberPath, metricId, queryMetricVersionNumber]);

  const dashboardVersionNumber = useMemo(() => {
    if (!dashboardId) return undefined;
    if (versionNumberPath) return parseInt(versionNumberPath);
    if (queryDashboardVersionNumber) return parseInt(queryDashboardVersionNumber);
    return undefined;
  }, [versionNumberPath, dashboardId, queryDashboardVersionNumber]);

  const isVersionHistoryMode = useMemo(() => {
    if (secondaryView === 'version-history') return true;
    return false;
  }, [secondaryView]);

  return useMemo(
    () => ({
      isVersionHistoryMode,
      chatId,
      metricId,
      dashboardId,
      collectionId,
      datasetId,
      messageId,
      metricVersionNumber,
      dashboardVersionNumber,
      currentRoute,
      secondaryView
    }),
    [
      chatId,
      metricId,
      secondaryView,
      dashboardId,
      collectionId,
      datasetId,
      messageId,
      metricVersionNumber,
      dashboardVersionNumber,
      currentRoute
    ]
  );
};

export type ChatParams = ReturnType<typeof useGetChatParams>;
