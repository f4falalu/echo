import type { BusterChatResponseMessage_file } from '@/api/asset_interfaces';
import {
  useGetSelectedAssetId,
  useGetSelectedAssetVersionNumber,
} from '@/context/BusterAssets/useSelectedAssetType';

export const useGetIsSelectedFile = ({
  responseMessage,
}: {
  responseMessage: Pick<BusterChatResponseMessage_file, 'file_type' | 'id' | 'version_number'>;
}): {
  isSelectedFile: boolean;
} => {
  const selectedVersionNumber = useGetSelectedAssetVersionNumber();
  const selectedFileId = useGetSelectedAssetId();
  const isSelectedFile = selectedFileId === responseMessage.id;

  const versionNumber = responseMessage.version_number;
  const isSelectedVersion = versionNumber === selectedVersionNumber || !selectedVersionNumber;

  switch (responseMessage.file_type) {
    case 'metric': {
      return { isSelectedFile: isSelectedFile && isSelectedVersion };
    }
    case 'dashboard': {
      return { isSelectedFile: isSelectedFile && isSelectedVersion };
    }
    case 'report': {
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
