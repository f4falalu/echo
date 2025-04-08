import { BusterChatResponseMessage_file } from '@/api/asset_interfaces';
import { queryKeys } from '@/api/query_keys';
import { useChatIndividualContextSelector } from '@/layouts/ChatLayout/ChatContext';
import { useQueryClient } from '@tanstack/react-query';

export const useGetIsSelectedFile = ({
  responseMessage
}: {
  responseMessage: Pick<BusterChatResponseMessage_file, 'file_type' | 'id' | 'version_number'>;
}): {
  isSelectedFile: boolean;
  isLatestVersion: boolean;
} => {
  const queryClient = useQueryClient();
  const isSelectedFile = useChatIndividualContextSelector(
    (x) => x.selectedFileId === responseMessage.id
  );

  const versionNumber = responseMessage.version_number;

  switch (responseMessage.file_type) {
    case 'metric': {
      const options = queryKeys.metricsGetMetric(responseMessage.id);
      const data = queryClient.getQueryData(options.queryKey);
      const lastVersion = data?.versions[data.versions.length - 1];
      const isLatestVersion = lastVersion?.version_number === versionNumber;
      return { isSelectedFile: isSelectedFile && isLatestVersion, isLatestVersion };
    }
    case 'dashboard': {
      const options = queryKeys.dashboardGetDashboard(responseMessage.id);
      const data = queryClient.getQueryData(options.queryKey)?.dashboard;
      const lastVersion = data?.versions[data.versions.length - 1];
      const isLatestVersion = lastVersion?.version_number === versionNumber;
      return { isSelectedFile: isSelectedFile && isLatestVersion, isLatestVersion };
    }
    case 'reasoning': {
      return { isSelectedFile: false, isLatestVersion: false };
    }
    default: {
      const exhaustiveCheck: never = responseMessage.file_type;
      return { isSelectedFile: false, isLatestVersion: false };
    }
  }
};
