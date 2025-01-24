'use client';

import { useMemo } from 'react';
import { SelectedFile } from '../interfaces';
import { useParams } from 'next/navigation';
import { AppChatMessageFileType } from '@/components/messages/AppChatMessageContainer';
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
    if (metricId) return { id: metricId, type: AppChatMessageFileType.Metric };
    if (collectionId) return { id: collectionId, type: AppChatMessageFileType.Collection };
    if (datasetId) return { id: datasetId, type: AppChatMessageFileType.Dataset };
    if (dashboardId) return { id: dashboardId, type: AppChatMessageFileType.Dashboard };
  }, [metricId, collectionId, datasetId, dashboardId, chatId]);

  const selectedLayout: ChatSplitterProps['selectedLayout'] = useMemo(() => {
    const hasFileId = metricId || collectionId || datasetId || dashboardId;

    if (chatId) {
      if (hasFileId) return 'both';
      return 'chat';
    }

    if (hasFileId) return 'file';

    return 'chat';
  }, [metricId, collectionId, datasetId, dashboardId, chatId]);

  return { selectedFile, selectedLayout };
};
