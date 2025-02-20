import React, { useMemo } from 'react';
import { FileContainerButtonsProps } from './interfaces';
import { FileButtonContainer } from './FileButtonContainer';
import { useChatIndividualContextSelector } from '../../ChatContext';
import { SaveDashboardToCollectionButton } from '@appComponents/Buttons/SaveDashboardToCollectionButton';
import { HideButtonContainer } from './HideButtonContainer';
import { useChatLayoutContextSelector } from '../../ChatLayoutContext';
import { CreateChatButton } from './CreateChatButtont';
import { ShareDashboardButton } from '@appComponents/Buttons/ShareDashboardButton';
import { Button, Dropdown } from 'antd';
import { AppMaterialIcons } from '@/components/ui';
import { MenuProps } from 'antd/lib';
import { useBusterDashboardContextSelector } from '@/context/Dashboards';
import { useRouter } from 'next/router';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { BusterRoutes } from '@/routes';

export const DashboardContainerHeaderButtons: React.FC<FileContainerButtonsProps> = React.memo(
  () => {
    const renderViewLayoutKey = useChatLayoutContextSelector((x) => x.renderViewLayoutKey);
    const selectedFileId = useChatIndividualContextSelector((x) => x.selectedFileId)!;

    return (
      <FileButtonContainer>
        <SaveToCollectionButton />
        <ShareDashboardButton dashboardId={selectedFileId} /> <AddContentToDashboardButton />
        <ThreeDotMenu dashboardId={selectedFileId} />
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
    <div>
      <Button type="text" icon={<AppMaterialIcons icon="add" />} />
    </div>
  );
});
AddContentToDashboardButton.displayName = 'AddContentToDashboardButton';

const ThreeDotMenu = React.memo(({ dashboardId }: { dashboardId: string }) => {
  const onDeleteDashboard = useBusterDashboardContextSelector((x) => x.onDeleteDashboard);
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);

  const menu: MenuProps = useMemo(() => {
    return {
      items: [
        {
          label: 'Delete',
          key: 'delete',
          icon: <AppMaterialIcons icon="delete" />,
          onClick: async () => {
            await onDeleteDashboard(dashboardId);
            onChangePage({ route: BusterRoutes.APP_DASHBOARDS });
          }
        }
      ]
    };
  }, [dashboardId, onDeleteDashboard, onChangePage]);

  return (
    <Dropdown menu={menu}>
      <Button type="text" icon={<AppMaterialIcons icon="more_horiz" />} />
    </Dropdown>
  );
});
ThreeDotMenu.displayName = 'ThreeDotMenu';
