import React from 'react';
import { FileButtonContainer } from '../FileButtonContainer';
import { useChatIndividualContextSelector } from '@/layouts/ChatLayout/ChatContext';
import { SaveDashboardToCollectionButton } from '@/components/features/buttons/SaveDashboardToCollectionButton';
import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { canEdit, getIsEffectiveOwner } from '@/lib/share';
import { ShareDashboardButton } from '@/components/features/buttons/ShareDashboardButton';
import { DashboardThreeDotMenu } from './DashboardThreeDotMenu';
import { HideButtonContainer } from '../HideButtonContainer';
import { CreateChatButton } from '../CreateChatButtont';
import { useDashboardContentStore } from '@/context/Dashboards';
import { AppTooltip } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';

export const DashboardHeaderButtons: React.FC<{
  dashboardId: string;
}> = ({ dashboardId }) => {
  const { data: permission } = useGetDashboard(
    { id: dashboardId },
    { select: (x) => x.permission }
  );

  const isEditor = canEdit(permission);
  const isEffectiveOwner = getIsEffectiveOwner(permission);

  return (
    <FileButtonContainer>
      <SaveToCollectionButton />
      {isEffectiveOwner && <ShareDashboardButton dashboardId={dashboardId} />}
      {isEditor && <AddContentToDashboardButton />}
      <DashboardThreeDotMenu dashboardId={dashboardId} />
      <HideButtonContainer show>
        <CreateChatButton assetId={dashboardId} assetType="dashboard" />
      </HideButtonContainer>
    </FileButtonContainer>
  );
};

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
