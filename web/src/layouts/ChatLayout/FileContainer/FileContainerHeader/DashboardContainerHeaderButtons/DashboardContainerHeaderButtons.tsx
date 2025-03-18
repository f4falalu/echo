import React from 'react';
import { FileContainerButtonsProps } from '../interfaces';
import { FileButtonContainer } from '../FileButtonContainer';
import { useChatIndividualContextSelector } from '../../../ChatContext';
import { SaveDashboardToCollectionButton } from '@/components/features/buttons/SaveDashboardToCollectionButton';
import { HideButtonContainer } from '../HideButtonContainer';
import { useChatLayoutContextSelector } from '../../../ChatLayoutContext';
import { CreateChatButton } from '../CreateChatButtont';
import { ShareDashboardButton } from '@/components/features/buttons/ShareDashboardButton';
import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import { DashboardThreeDotMenu } from './DashboardThreeDotMenu';
import { AppTooltip } from '@/components/ui/tooltip';

export const DashboardContainerHeaderButtons: React.FC<FileContainerButtonsProps> = React.memo(
  () => {
    const renderViewLayoutKey = useChatLayoutContextSelector((x) => x.renderViewLayoutKey);
    const selectedFileId = useChatIndividualContextSelector((x) => x.selectedFileId)!;

    return (
      <FileButtonContainer>
        <SaveToCollectionButton />
        <ShareDashboardButton dashboardId={selectedFileId} />
        <AddContentToDashboardButton />
        <DashboardThreeDotMenu dashboardId={selectedFileId} />
        <HideButtonContainer show={renderViewLayoutKey === 'file'}>
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
  return (
    <AppTooltip title="Add to dashboard">
      <Button variant="ghost" prefix={<Plus />} />
    </AppTooltip>
  );
});
AddContentToDashboardButton.displayName = 'AddContentToDashboardButton';
