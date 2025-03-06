'use client';

import { useMemo } from 'react';
import type { ChatLayoutView, SelectedFile } from '../interfaces';
import { usePathname } from 'next/navigation';

interface ParsedParams {
  metricId?: string;
  collectionId?: string;
  datasetId?: string;
  dashboardId?: string;
  chatId?: string;
  messageId?: string;
}

export const parsePathnameSegments = (pathname: string): ParsedParams => {
  const params: ParsedParams = {};

  // Remove leading slash and split into segments
  //example: /app/chats/c2adc995-82b9-45a6-8dff-1cf897665fb0/reasoning/6cd53c00-0b5e-44fc-9a22-c50c00860610
  //example: /app/chats/c2adc995-82b9-45a6-8dff-1cf897665fb0/metric/1234567890
  //example: /app/dashboards/c2adc995-82b9-45a6-8dff-1cf897665fb0
  //example: /app/datasets/c2adc995-82b9-45a6-8dff-1cf897665fb0

  const segments = pathname.split('/').filter(Boolean);

  segments.forEach((segment, index) => {
    // Check for chats segment
    if (segment === 'chats' && segments[index + 1]) {
      params.chatId = segments[index + 1];
    }

    // Check for dashboards segment
    if (segment === 'dashboards' && segments[index + 1]) {
      params.dashboardId = segments[index + 1];
    }

    // Check for datasets segment
    if (segment === 'datasets' && segments[index + 1]) {
      params.datasetId = segments[index + 1];
    }

    // Check for reasoning segment with messageId
    if (segment === 'reasoning' && segments[index + 1]) {
      params.messageId = segments[index + 1];
    }

    // Check for metric segment
    if (segment === 'metric' && segments[index + 1]) {
      params.metricId = segments[index + 1];
    }

    if (segment === 'collection' && segments[index + 1]) {
      params.collectionId = segments[index + 1];
    }
  });

  return params;
};

export const useSelectedFileByParams = () => {
  const pathname = usePathname();

  const params = useMemo(() => parsePathnameSegments(pathname), [pathname]);
  const { metricId, collectionId, datasetId, dashboardId, chatId, messageId } = params;

  const selectedFile: SelectedFile | undefined = useMemo(() => {
    if (metricId) return { id: metricId, type: 'metric' };
    if (dashboardId) return { id: dashboardId, type: 'dashboard' };
    if (messageId) return { id: messageId, type: 'reasoning' };
  }, [metricId, dashboardId, messageId, pathname]);

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
