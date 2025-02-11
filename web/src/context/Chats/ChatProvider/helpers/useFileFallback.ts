import { SelectedFile } from '@/app/app/_layouts/ChatLayout';
import { useBusterDashboardContextSelector } from '@/context/Dashboards';
import { useBusterMetricsIndividualContextSelector } from '@/context/Metrics';
import { useMemo } from 'react';
import { IBusterChat, IBusterChatMessage } from '../../interfaces';
import { FileType } from '@/api/asset_interfaces';

export const useFileFallback = ({
  defaultSelectedFile
}: {
  //if metricId is provided (without a chatId), we can assume that the chat is a new chat starting from a metric
  defaultSelectedFile?: SelectedFile;
}) => {
  const fileId = defaultSelectedFile?.id || '';
  const { metricTitle, metricVersionNumber } = useMetricParams(fileId);
  const { dashboardTitle, dashboardVersionNumber } = useDashboardParams(fileId);

  const fileType: FileType = useMemo(() => {
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
    return fallbackToFileChat({
      id: fileId
    });
  }, [fileId]);

  const memoizedFallbackToChatMessage = useMemo(() => {
    return fallbackToFileChatMessage({
      id: fileId,
      title: title,
      versionNumber: versionNumber,
      type: fileType
    });
  }, [fileId, title, versionNumber, fileType]);

  return { memoizedFallbackToMetricChat, memoizedFallbackToChatMessage };
};

const fallbackToFileChat = ({ id }: { id: string }): IBusterChat => {
  return {
    id,
    messages: [fallbackMessageId(id)],
    title: '',
    is_favorited: false,
    updated_at: '',
    created_at: '',
    created_by: '',
    created_by_id: '',
    created_by_name: '',
    created_by_avatar: ''
  };
};

const fallbackMessageId = (id: string) => {
  return `init-message-${id}`;
};

const fallbackToFileChatMessage = ({
  id,
  title,
  versionNumber,
  type = 'metric'
}: {
  id: string;
  title: string | undefined;
  versionNumber: number;
  type: FileType;
}): IBusterChatMessage => {
  return {
    request_message: null,
    reasoning: [],
    response_messages: [
      {
        id: 'init',
        type: 'text',
        message: `I've pulled in your ${type}. How can I help? Is there anything you'd like to modify?`
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
    id: fallbackMessageId(id),
    isCompletedStream: false
  };
};

const useMetricParams = (fileId: string) => {
  const metricTitle = useBusterMetricsIndividualContextSelector((x) => x.metrics[fileId]?.title);
  const metricVersionNumber = useBusterMetricsIndividualContextSelector(
    (x) => x.metrics[fileId]?.version_number
  );

  return { metricTitle, metricVersionNumber };
};

const useDashboardParams = (fileId: string) => {
  const dashboardTitle = useBusterDashboardContextSelector(
    (x) => x.dashboards[fileId]?.dashboard?.title
  );
  const dashboardVersionNumber = useBusterDashboardContextSelector(
    (x) => x.dashboards[fileId]?.dashboard?.version_number
  );

  return { dashboardTitle, dashboardVersionNumber };
};
