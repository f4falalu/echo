import { FileType } from '@/api/buster_socket/chats';
import { useDashboardContextSelector, useIndividualDashboard } from '@/context/Dashboards';
import React, { useMemo } from 'react';

interface UseChatAssetProps {
  selectedFileId?: string;
  selectedFileType?: FileType;
}

export const useChatAsset = ({ selectedFileId, selectedFileType }: UseChatAssetProps) => {
  const dashboardId = selectedFileType === 'dashboard' ? selectedFileId : undefined;
  const metricId = selectedFileType === 'metric' ? selectedFileId : undefined;
  const collectionId = selectedFileType === 'collection' ? selectedFileId : undefined;

  const dashboard = useIndividualDashboard({ dashboardId })?.dashboardResponse;

  //   const x = useDashboardContextSelector((x) => x.d);
  useIndividualDashboard({ dashboardId });

  const selectedFile = useMemo(() => {
    if (!selectedFileId || !selectedFileType) return undefined;
    return {
      id: selectedFileId,
      type: selectedFileType
    };
  }, [selectedFileId, selectedFileType]);

  return {};
};
