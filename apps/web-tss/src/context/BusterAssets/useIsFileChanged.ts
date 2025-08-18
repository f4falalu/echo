import { useMemo } from 'react';
import { useIsDashboardChanged } from '@/context/Dashboards/useIsDashboardChanged';
import { useIsMetricChanged } from '@/context/Metrics/useIsMetricChanged';
import type { FileType } from '../../api/asset_interfaces/chat';

type UseIsFileChangeReturn = {
  isFileChanged: boolean;
  onResetToOriginal: () => void;
};

type UseIsFileChangeParams = {
  selectedFileId: string | undefined;
  selectedFileType: FileType | undefined;
};

export const useIsFileChanged = ({
  selectedFileId,
  selectedFileType,
}: UseIsFileChangeParams): UseIsFileChangeReturn => {
  const { isMetricChanged, onResetMetricToOriginal } = useIsMetricChanged({
    metricId: selectedFileType === 'metric' ? selectedFileId : undefined,
  });

  const { isDashboardChanged, onResetDashboardToOriginal } = useIsDashboardChanged({
    dashboardId: selectedFileType === 'dashboard' ? selectedFileId : undefined,
  });

  return useMemo(() => {
    if (selectedFileType === 'metric')
      return {
        isFileChanged: isMetricChanged,
        onResetToOriginal: onResetMetricToOriginal,
      };
    if (selectedFileType === 'dashboard')
      return {
        isFileChanged: isDashboardChanged,
        onResetToOriginal: onResetDashboardToOriginal,
      };
    return { isFileChanged: false, onResetToOriginal: () => {} };
  }, [
    isMetricChanged,
    isDashboardChanged,
    selectedFileType,
    onResetMetricToOriginal,
    onResetDashboardToOriginal,
  ]);
};
