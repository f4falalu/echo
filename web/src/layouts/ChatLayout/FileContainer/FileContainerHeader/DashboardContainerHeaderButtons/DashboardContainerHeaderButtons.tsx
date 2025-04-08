'use client';

import React from 'react';
import { FileContainerButtonsProps } from '../interfaces';
import { FileButtonContainer } from '../FileButtonContainer';
import { useChatIndividualContextSelector } from '../../../ChatContext';
import { SaveDashboardToCollectionButton } from '@/components/features/buttons/SaveDashboardToCollectionButton';
import { HideButtonContainer } from '../HideButtonContainer';
import { CreateChatButton } from '../CreateChatButtont';
import { ShareDashboardButton } from '@/components/features/buttons/ShareDashboardButton';
import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import { DashboardThreeDotMenu } from './DashboardThreeDotMenu';
import { AppTooltip } from '@/components/ui/tooltip';
import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { canEdit, getIsEffectiveOwner } from '@/lib/share';
import { useDashboardContentStore } from '@/context/Dashboards';

export const DashboardContainerHeaderButtons: React.FC<FileContainerButtonsProps> = React.memo(
  ({ selectedFileId }) => {
    const dashboardId = selectedFileId || '';

    const { data: permission, error: dashboardError } = useGetDashboard(
      { id: dashboardId },
      { select: (x) => x.permission }
    );

    if (dashboardError) return null;

    const isEditor = canEdit(permission);
    const isEffectiveOwner = getIsEffectiveOwner(permission);

    return (
      <FileButtonContainer>
        <SaveToCollectionButton />
        {isEffectiveOwner && <ShareDashboardButton dashboardId={dashboardId} />}
        {isEditor && <AddContentToDashboardButton />}
        <DashboardThreeDotMenu dashboardId={dashboardId} />
        <HideButtonContainer show>
          <CreateChatButton />
        </HideButtonContainer>
      </FileButtonContainer>
    );
  }
);

DashboardContainerHeaderButtons.displayName = 'DashboardContainerHeaderButtons';

const SaveToCollectionButton = React.memo(() => {
  const selectedFileId = useChatIndividualContextSelector((x) => x.selectedFileId)!;
  return <SaveDashboardToCollectionButton dashboardIds={[selectedFileId]} />;
});
SaveToCollectionButton.displayName = 'SaveToCollectionButton';

const AddContentToDashboardButton = React.memo(() => {
  const onOpenAddContentModal = useDashboardContentStore((x) => x.onOpenAddContentModal);

  return (
    <AppTooltip title="Add content">
      <Button variant="ghost" prefix={<Plus />} onClick={onOpenAddContentModal} />
    </AppTooltip>
  );
});
AddContentToDashboardButton.displayName = 'AddContentToDashboardButton';
