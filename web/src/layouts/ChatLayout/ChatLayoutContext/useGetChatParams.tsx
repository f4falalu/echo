'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

export const useGetChatParams = () => {
  const { chatId, metricId, dashboardId, collectionId, datasetId, messageId } = useParams() as {
    chatId: string;
    metricId: string;
    dashboardId: string;
    collectionId: string;
    datasetId: string;
    messageId: string;
  };
  const searchParams = useSearchParams();
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
      dashboardVersionNumber
    }),
    [
      chatId,
      metricId,
      dashboardId,
      collectionId,
      datasetId,
      messageId,
      metricVersionNumber,
      dashboardVersionNumber
    ]
  );
};
