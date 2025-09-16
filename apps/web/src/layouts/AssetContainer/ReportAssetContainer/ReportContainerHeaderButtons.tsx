import type { GetReportResponse } from '@buster/server-shared/reports';
import type React from 'react';
import { useCallback } from 'react';
import { useGetReport } from '@/api/buster_rest/reports';
import { CreateChatButton } from '@/components/features/AssetLayout/CreateChatButton';
import { ShareReportButton } from '@/components/features/buttons/ShareReportButton';
import { ClosePageButton } from '@/components/features/chat/ClosePageButton';
import { ReportThreeDotMenu } from '@/components/features/reports/ReportThreeDotMenu';
import { useIsChatMode, useIsFileMode } from '@/context/Chats/useMode';
import { useIsReportReadOnly } from '@/context/Reports/useIsReportReadOnly';
import { canEdit, getIsEffectiveOwner } from '@/lib/share';
import { FileButtonContainer } from '../FileButtonContainer';
import { HideButtonContainer } from '../HideButtonContainer';

interface ReportContainerHeaderButtonsProps {
  reportId: string;
  reportVersionNumber: number | undefined;
}

export const ReportContainerHeaderButtons: React.FC<ReportContainerHeaderButtonsProps> = ({
  reportId,
  reportVersionNumber,
}) => {
  const isChatMode = useIsChatMode();
  const isFileMode = useIsFileMode();
  const { isViewingOldVersion } = useIsReportReadOnly({
    reportId: reportId || '',
  });
  const { data: permission } = useGetReport(
    { id: reportId },
    { select: useCallback((x: GetReportResponse) => x.permission, []) }
  );

  const isEffectiveOwner = getIsEffectiveOwner(permission);
  const isEditor = canEdit(permission);

  return (
    <FileButtonContainer>
      {isEffectiveOwner && <ShareReportButton reportId={reportId} />}

      <ReportThreeDotMenu
        reportId={reportId}
        reportVersionNumber={reportVersionNumber}
        isViewingOldVersion={isViewingOldVersion}
      />

      <HideButtonContainer show={isFileMode && isEditor}>
        <CreateChatButton assetId={reportId} assetType="report" />
      </HideButtonContainer>
      {isChatMode && <ClosePageButton />}
    </FileButtonContainer>
  );
};
