import { SelectedFile } from '@/app/app/_layouts/ChatLayout';
import { useDashboardContextSelector } from '@/context/Dashboards';
import { useBusterMetricsContextSelector } from '@/context/Metrics';
import { useMemo } from 'react';
import { IBusterChat } from '../interfaces';

export const useFileFallback = ({
  defaultSelectedFile
}: {
  //if metricId is provided (without a chatId), we can assume that the chat is a new chat starting from a metric
  defaultSelectedFile?: SelectedFile;
}) => {
  const fileId = defaultSelectedFile?.id || '';
  const metricTitle = useBusterMetricsContextSelector((x) => x.metrics[fileId]?.title);
  const metricVersionNumber = useBusterMetricsContextSelector(
    (x) => x.metrics[fileId]?.version_number
  );
  const dashboardTitle = useDashboardContextSelector((x) => x.dashboards[fileId]?.dashboard?.title);
  const dashboardVersionNumber = useDashboardContextSelector(
    (x) => x.dashboards[fileId]?.dashboard?.version_number
  );

  const fileType: 'metric' | 'dashboard' = useMemo(() => {
    if (defaultSelectedFile?.type === 'metric') {
      return 'metric';
    } else {
      return 'dashboard';
    }
  }, [defaultSelectedFile]);

  const title = useMemo(() => {
    if (fileType === 'metric') {
      return metricTitle;
    } else if (fileType === 'dashboard') {
      return dashboardTitle;
    }
  }, [fileType, metricTitle, dashboardTitle]);

  const versionNumber = useMemo(() => {
    if (fileType === 'metric') {
      return metricVersionNumber || 1;
    } else if (fileType === 'dashboard') {
      return dashboardVersionNumber || 1;
    }
    return 1;
  }, [fileType, metricVersionNumber, dashboardVersionNumber]);

  const memoizedFallbackToMetricChat = useMemo(() => {
    console.log(fileType, defaultSelectedFile);
    return fallbackToFileChat({
      id: fileId,
      title: title,
      versionNumber: versionNumber,
      type: fileType
    });
  }, [fileId, title, versionNumber, fileType]);

  return memoizedFallbackToMetricChat;
};

const fallbackToFileChat = ({
  id,
  title,
  versionNumber,
  type = 'metric'
}: {
  id: string;
  title: string | undefined;
  versionNumber: number;
  type?: 'metric' | 'dashboard';
}): IBusterChat => {
  console.log(type);
  return {
    id,
    isNewChat: true,
    isFollowupMessage: false,
    messages: [
      {
        request_message: null,
        response_messages: [
          {
            id: 'init',
            type: 'text',
            message: `I’ve pulled in your ${type}. How can I help? Is there anything you'd like to modify?`
          },
          {
            id,
            type: 'file',
            file_type: type,
            file_name: title || `New ${type}`,
            version_number: versionNumber,
            version_id: id,
            metadata: [
              {
                status: 'completed',
                message: `Retrieved ${type}`
              }
            ]
          }
        ],
        created_at: '',
        id: 'init-message',
        isCompletedStream: false
      }
    ],
    title: title || 'New Chat',
    is_favorited: false,
    updated_at: '',
    created_at: '',
    created_by: '',
    created_by_id: '',
    created_by_name: '',
    created_by_avatar: ''
  };
};
