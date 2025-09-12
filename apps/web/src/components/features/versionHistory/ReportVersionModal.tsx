import type { ReportResponse } from '@buster/server-shared/reports';
import React, { useCallback } from 'react';
import { useGetReport, useUpdateReport } from '@/api/buster_rest/reports';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ReportPageController } from '@/controllers/ReportPageControllers';
import { useVersionHistoryModalCommon } from './useVersionHistoryModalCommon';
import { VersionHistoryModal, type VersionHistoryModalProps } from './VersionHistoryModal';

type ReportVersionModalProps = Pick<VersionHistoryModalProps, 'onClose' | 'versionNumber'> & {
  reportId: string;
};

export const ReportVersionModal = React.memo(
  ({ onClose, versionNumber: versionNumberProp, reportId }: ReportVersionModalProps) => {
    const { data } = useGetReport(
      { id: reportId },
      {
        select: useCallback(
          (x: ReportResponse) => ({
            versions: x.versions,
            name: x.name,
          }),
          []
        ),
      }
    );
    const { mutateAsync: updateReport, isPending: isRestoringVersion } = useUpdateReport();

    const {
      title,
      versionNumber,
      versionHistoryItems,
      onClickVersion,
      onClickRestoreVersion,
      learnMoreButton,
    } = useVersionHistoryModalCommon({
      versionNumber: versionNumberProp,
      versions: data?.versions,
      title: data?.name,
      isRestoringVersion,
      onClose,
      updateAsset: async (versionNumber: number) => {
        await updateReport({
          reportId,
          restore_to_version: versionNumber,
        });
      },
    });

    return (
      <VersionHistoryModal
        onClose={onClose}
        versionNumber={versionNumber}
        title={title}
        versionHistoryItems={versionHistoryItems}
        onClickVersion={onClickVersion}
        onClickRestoreVersion={onClickRestoreVersion}
        isRestoringVersion={isRestoringVersion}
        learnMoreButton={learnMoreButton}
      >
        {versionNumber && (
          <ScrollArea className="h-full">
            <ReportPageController reportId={reportId} readOnly />
          </ScrollArea>
        )}
      </VersionHistoryModal>
    );
  }
);
