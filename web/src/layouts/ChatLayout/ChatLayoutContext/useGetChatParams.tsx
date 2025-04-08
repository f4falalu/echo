'use client';

import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import {
  useParams,
  usePathname,
  useSearchParams,
  useSelectedLayoutSegments
} from 'next/navigation';
import { useMemo } from 'react';

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
  const segments = useSelectedLayoutSegments();
  const queryMetricVersionNumber = searchParams.get('metric_version_number');
  const queryDashboardVersionNumber = searchParams.get('dashboard_version_number');
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

  const isVersionHistoryMode: boolean = useMemo(() => {
    if (!chatId && (metricVersionNumber || dashboardVersionNumber)) return true; // we don't need to show the version history mode if we are in a chat

    return (
      !!chatId &&
      !!(metricVersionNumber || dashboardVersionNumber) &&
      segments.some((segment) => segment.startsWith('version'))
    );
  }, [segments, !!chatId, !!metricVersionNumber, !!dashboardVersionNumber]);

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
      currentRoute
    }),
    [
      chatId,
      metricId,
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
