'use client';

import { useMemo } from 'react';
import { SelectedFile } from '../interfaces';
import { useParams } from 'next/navigation';
import { ChatSplitterProps } from '../ChatLayout';

export const useSelectedFileByParams = () => {
  const { metricId, collectionId, datasetId, dashboardId, chatId } = useParams() as {
    metricId?: string;
    collectionId?: string;
    datasetId?: string;
    dashboardId?: string;
    chatId?: string;
  };

  const selectedFile: SelectedFile | undefined = useMemo(() => {
    if (metricId) return { id: metricId, type: 'metric' };
    if (collectionId) return { id: collectionId, type: 'collection' };
    if (datasetId) return { id: datasetId, type: 'dataset' };
    if (dashboardId) return { id: dashboardId, type: 'dashboard' };
  }, [metricId, collectionId, datasetId, dashboardId, chatId]);

  const selectedLayout: ChatSplitterProps['defaultSelectedLayout'] = useMemo(() => {
    const hasFileId = metricId || collectionId || datasetId || dashboardId;

    if (chatId) {
      if (hasFileId) return 'both';
      return 'chat';
    }

    if (hasFileId) return 'file';

    return 'chat';
  }, [metricId, collectionId, datasetId, dashboardId, chatId]);

  return { selectedFile, selectedLayout, chatId };
};
