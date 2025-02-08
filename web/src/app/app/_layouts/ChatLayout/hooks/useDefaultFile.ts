'use client';

import { useMemo } from 'react';
import { SelectedFile } from '../interfaces';
import { useParams } from 'next/navigation';
import { ChatSplitterProps } from '../ChatLayout';

export const useSelectedFileByParams = () => {
  const { metricId, collectionId, datasetId, dashboardId, chatId, messageId } = useParams() as {
    metricId?: string;
    collectionId?: string;
    datasetId?: string;
    dashboardId?: string;
    chatId?: string;
    messageId?: string;
  };

  const selectedFile: SelectedFile | undefined = useMemo(() => {
    if (metricId) return { id: metricId, type: 'metric' };
    if (dashboardId) return { id: dashboardId, type: 'dashboard' };
    if (messageId) return { id: messageId, type: 'reasoning' };
    // if (collectionId) return { id: collectionId, type: 'collection' };
    // if (datasetId) return { id: datasetId, type: 'dataset' };
  }, [metricId, collectionId, datasetId, dashboardId, chatId, messageId]);

  const selectedLayout: ChatSplitterProps['defaultSelectedLayout'] = useMemo(() => {
    const hasFileId = metricId || collectionId || datasetId || dashboardId || messageId;

    if (chatId) {
      if (hasFileId) return 'both';
      return 'chat';
    }

    if (hasFileId) return 'file';

    return 'chat';
  }, [metricId, collectionId, datasetId, dashboardId, chatId]);

  console.log(selectedFile, selectedLayout, chatId);

  return { selectedFile, selectedLayout, chatId };
};
