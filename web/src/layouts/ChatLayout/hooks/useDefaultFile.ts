'use client';

import { useMemo } from 'react';
import type { ChatLayoutView, SelectedFile } from '../interfaces';
import { useParams, usePathname, useSelectedLayoutSegments, useRouter } from 'next/navigation';

export const useSelectedFileByParams = () => {
  const { metricId, collectionId, datasetId, dashboardId, chatId, messageId } = useParams() as {
    metricId?: string;
    collectionId?: string;
    datasetId?: string;
    dashboardId?: string;
    chatId?: string;
    messageId?: string;
  };

  const segments = useSelectedLayoutSegments();
  const pathname = usePathname();

  const isReasoningSegments = useMemo(() => {
    return segments.some((segment) => segment === 'reasoning');
  }, [segments]);

  const selectedFile: SelectedFile | undefined = useMemo(() => {
    if (metricId) return { id: metricId, type: 'metric' };
    if (dashboardId) return { id: dashboardId, type: 'dashboard' };
    if (messageId && isReasoningSegments) return { id: messageId, type: 'reasoning' };
    // if (collectionId) return { id: collectionId, type: 'collection' };
    // if (datasetId) return { id: datasetId, type: 'dataset' };
  }, [
    metricId,
    collectionId,
    datasetId,
    dashboardId,
    chatId,
    messageId,
    isReasoningSegments,
    pathname
  ]);

  const selectedLayout: ChatLayoutView = useMemo(() => {
    const hasFileId = metricId || collectionId || datasetId || dashboardId || messageId;

    if (chatId) {
      if (hasFileId) return 'both';
      return 'chat';
    }

    if (hasFileId) return 'file';

    return 'chat';
  }, [metricId, collectionId, datasetId, dashboardId, chatId]);

  return { selectedFile, selectedLayout, chatId };
};

export type SelectedFileParams = ReturnType<typeof useSelectedFileByParams>;
