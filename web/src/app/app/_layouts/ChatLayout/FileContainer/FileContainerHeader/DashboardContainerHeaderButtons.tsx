import React from 'react';
import { FileContainerButtonsProps } from './interfaces';
import { FileButtonContainer } from './FileButtonContainer';
import { useChatContextSelector } from '../../ChatContext';
import { SaveDashboardToCollectionButton } from '@appComponents/Buttons/SaveDashboardToCollectionButton';
import { HideButtonContainer } from './HideButtonContainer';
import { useChatLayoutContextSelector } from '../../ChatLayoutContext';
import { CreateChatButton } from './CreateChatButtont';
import { ShareDashboardButton } from '@appComponents/Buttons/ShareDashboardButton';
import { Button } from 'antd';
import { AppMaterialIcons } from '@/components/icons';

export const DashboardContainerHeaderButtons: React.FC<FileContainerButtonsProps> = React.memo(
  () => {
    const isPureFile = useChatLayoutContextSelector((x) => x.isPureFile);
    const selectedFileId = useChatContextSelector((x) => x.selectedFileId)!;

    return (
      <FileButtonContainer>
        <SaveToCollectionButton />
        <ShareDashboardButton dashboardId={selectedFileId} /> <AddContentToDashboardButton />
        <HideButtonContainer show={isPureFile}>
          <CreateChatButton />
        </HideButtonContainer>
      </FileButtonContainer>
    );
  }
);

DashboardContainerHeaderButtons.displayName = 'DashboardContainerHeaderButtons';

const SaveToCollectionButton = React.memo(() => {
  const selectedFileId = useChatContextSelector((x) => x.selectedFileId)!;
  return <SaveDashboardToCollectionButton dashboardIds={[selectedFileId]} />;
});
SaveToCollectionButton.displayName = 'SaveToCollectionButton';

const AddContentToDashboardButton = React.memo(() => {
  return (
    <div>
      <Button type="text" icon={<AppMaterialIcons icon="add" />} />
    </div>
  );
});
AddContentToDashboardButton.displayName = 'AddContentToDashboardButton';
