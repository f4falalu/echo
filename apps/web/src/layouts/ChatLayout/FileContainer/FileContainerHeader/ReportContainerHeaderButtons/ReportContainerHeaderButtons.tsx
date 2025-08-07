import React from 'react';
import type { FileContainerButtonsProps } from '../interfaces';
import { FileButtonContainer } from '../FileButtonContainer';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout/ChatLayoutContext';
import { useIsReportReadOnly } from '@/context/Reports/useIsReportReadOnly';
import { useGetReport } from '@/api/buster_rest/reports';
import { canEdit, getIsEffectiveOwner } from '@/lib/share';
import { ShareReportButton } from '@/components/features/buttons/ShareReportButton';
import { ReportThreeDotMenu } from './ReportThreeDotMenu';
import { HideButtonContainer } from '../HideButtonContainer';
import { CreateChatButton } from '../CreateChatButtont';

export const ReportContainerHeaderButtons: React.FC<FileContainerButtonsProps> = ({
  selectedFileId,
  selectedFileView
}) => {
  const reportId = selectedFileId || '';
  const selectedLayout = useChatLayoutContextSelector((x) => x.selectedLayout);
  const reportVersionNumber = useChatLayoutContextSelector((x) => x.reportVersionNumber);
  const { isViewingOldVersion } = useIsReportReadOnly({
    reportId: reportId || ''
  });
  const { error: reportError, data: permission } = useGetReport(
    { reportId },
    { select: (x) => x.permission }
  );

  if (reportError || !permission) return null;

  const isEffectiveOwner = getIsEffectiveOwner(permission);

  return (
    <FileButtonContainer>
      {isEffectiveOwner && !isViewingOldVersion && <ShareReportButton reportId={reportId} />}
      <ReportThreeDotMenu
        reportId={reportId}
        reportVersionNumber={reportVersionNumber}
        isViewingOldVersion={isViewingOldVersion}
      />
      <HideButtonContainer show={selectedLayout === 'file-only'}>
        <CreateChatButton assetId={reportId} assetType="report" />
      </HideButtonContainer>
    </FileButtonContainer>
  );
};
