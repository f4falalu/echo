import type { GetReportResponse } from '@buster/server-shared/reports';
import last from 'lodash/last';
import { useCallback, useMemo } from 'react';
import { useGetReport } from '@/api/buster_rest/reports';
import { canEdit } from '@/lib/share';
import { useChatIsVersionHistoryMode } from '../Chats/useIsVersionHistoryMode';
import { useGetReportParams } from './useGetReportParams';

export const useIsReportReadOnly = ({
  reportId,
  readOnly,
}: {
  reportId: string;
  readOnly?: boolean;
}) => {
  const isVersionHistoryMode = useChatIsVersionHistoryMode({ type: 'report' });
  const { reportVersionNumber } = useGetReportParams();
  const {
    data: reportData,
    isFetched,
    isError,
  } = useGetReport(
    { id: reportId },
    {
      select: useCallback((x: GetReportResponse) => {
        return {
          permission: x.permission,
          versions: x.versions,
          version_number: x.version_number,
        };
      }, []),
    }
  );

  const isViewingOldVersion = checkIfReportIsViewingOldVersion(reportVersionNumber, reportData);

  const isReadOnly = useMemo(() => {
    if (readOnly) return true;
    if (isError) return true;
    if (!isFetched) return true;
    if (!canEdit(reportData?.permission)) return true;
    if (isVersionHistoryMode) return true;
    if (isViewingOldVersion) return true;
    return false;
  }, [isError, isFetched, reportData, isVersionHistoryMode, isViewingOldVersion, readOnly]);

  return {
    isFetched,
    isError,
    isVersionHistoryMode,
    isReadOnly,
    isViewingOldVersion,
  };
};

const checkIfReportIsViewingOldVersion = (
  reportVersionNumber: number | undefined,
  reportData?: {
    versions: GetReportResponse['versions'];
    version_number: GetReportResponse['version_number'];
  }
) => {
  if (!reportVersionNumber) return false;
  if (reportVersionNumber !== last(reportData?.versions)?.version_number) return true;
  return false;
};
