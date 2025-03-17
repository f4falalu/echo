import React, { useMemo } from 'react';
import { FileContainerButtonsProps } from '../interfaces';
import { FileButtonContainer } from '../FileButtonContainer';
import { useChatIndividualContextSelector } from '../../../ChatContext';
import { SaveDashboardToCollectionButton } from '@/components/features/buttons/SaveDashboardToCollectionButton';
import { HideButtonContainer } from '../HideButtonContainer';
import { useChatLayoutContextSelector } from '../../../ChatLayoutContext';
import { CreateChatButton } from '../CreateChatButtont';
import { ShareDashboardButton } from '@/components/features/buttons/ShareDashboardButton';
import { Button } from '@/components/ui/buttons';
import { Dropdown, DropdownItems } from '@/components/ui/dropdown';
import { Dots, Plus, Trash } from '@/components/ui/icons';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { BusterRoutes } from '@/routes';
import { useDeleteDashboards } from '@/api/buster_rest/dashboards';

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
      <Button variant="ghost" prefix={<Plus />} />
    </div>
  );
});
AddContentToDashboardButton.displayName = 'AddContentToDashboardButton';

const ThreeDotMenu = React.memo(({ dashboardId }: { dashboardId: string }) => {
  const { mutateAsync: deleteDashboard, isPending: isDeletingDashboard } = useDeleteDashboards();
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);

  const items: DropdownItems = useMemo(() => {
    return [
      {
        label: 'Delete',
        value: 'delete',
        icon: <Trash />,
        onClick: async () => {
          await deleteDashboard({ dashboardId });
          onChangePage({ route: BusterRoutes.APP_DASHBOARDS });
        }
      }
    ];
  }, [dashboardId, deleteDashboard, onChangePage]);

  return (
    <Dropdown items={items}>
      <Button variant="ghost" prefix={<Dots />} />
    </Dropdown>
  );
});
ThreeDotMenu.displayName = 'ThreeDotMenu';
