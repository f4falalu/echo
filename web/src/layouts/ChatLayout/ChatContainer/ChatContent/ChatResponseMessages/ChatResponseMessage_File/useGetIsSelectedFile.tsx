import { BusterChatResponseMessage_file } from '@/api/asset_interfaces';
import { queryKeys } from '@/api/query_keys';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout';
import { useChatIndividualContextSelector } from '@/layouts/ChatLayout/ChatContext';
import { useQueryClient } from '@tanstack/react-query';

export const useGetIsSelectedFile = ({
  responseMessage
}: {
  responseMessage: Pick<BusterChatResponseMessage_file, 'file_type' | 'id' | 'version_number'>;
}): {
  isSelectedFile: boolean;
} => {
  const queryClient = useQueryClient();
  const isSelectedFile = useChatIndividualContextSelector(
    (x) => x.selectedFileId === responseMessage.id
  );
  const metricVersionNumber = useChatLayoutContextSelector((x) => x.metricVersionNumber);
  const dashboardVersionNumber = useChatLayoutContextSelector((x) => x.dashboardVersionNumber);
  const versionNumber = responseMessage.version_number;

  switch (responseMessage.file_type) {
    case 'metric': {
      const isSelectedVersion = versionNumber.toString() === metricVersionNumber;
      return { isSelectedFile: isSelectedFile && isSelectedVersion };
    }
    case 'dashboard': {
      const isSelectedVersion = versionNumber.toString() === dashboardVersionNumber;
      return { isSelectedFile: isSelectedFile && isSelectedVersion };
    }
    case 'reasoning': {
      return { isSelectedFile: false };
    }
    default: {
      const exhaustiveCheck: never = responseMessage.file_type;
      return { isSelectedFile: false };
    }
  }
};
