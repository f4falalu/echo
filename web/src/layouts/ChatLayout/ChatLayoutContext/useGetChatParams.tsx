'use client';

import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useParams, usePathname, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

export const useGetChatParams = () => {
  const { chatId, metricId, dashboardId, collectionId, datasetId, messageId } = useParams() as {
    chatId: string | undefined;
    metricId: string | undefined;
    dashboardId: string | undefined;
    collectionId: string | undefined;
    datasetId: string | undefined;
    messageId: string | undefined;
  };
  const searchParams = useSearchParams();
  const currentRoute = useAppLayoutContextSelector((state) => state.currentRoute);

  const metricVersionNumber = searchParams.get('metric_version_number');
  const dashboardVersionNumber = searchParams.get('dashboard_version_number');

  return useMemo(
    () => ({
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
