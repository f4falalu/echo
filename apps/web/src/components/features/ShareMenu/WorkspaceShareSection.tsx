import React from 'react';
import type { ShareAssetType, ShareConfig, WorkspaceShareRole } from '@buster/server-shared/share';
import { Dropdown } from '@/components/ui/dropdown';
import type { DropdownItem } from '@/components/ui/dropdown';
import { ChevronDown } from '@/components/ui/icons/NucleoIconFilled';
import { ApartmentBuilding } from '@/components/ui/icons/NucleoIconFilled';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/classMerge';

const workspaceShareRoleItems: DropdownItem<WorkspaceShareRole>[] = [
  {
    value: 'fullAccess',
    label: 'Full access',
    secondaryLabel: 'Can edit and share with others.'
  },
  {
    value: 'canEdit',
    label: 'Can edit',
    secondaryLabel: 'Can edit, but not share with others.'
  },
  {
    value: 'canView',
    label: 'Can view',
    secondaryLabel: 'Cannot edit or share with others.'
  },
  {
    value: 'none',
    label: 'Not shared',
    secondaryLabel: 'Does not have access.'
  }
];

interface WorkspaceShareSectionProps {
  shareAssetConfig: ShareConfig;
  assetType: ShareAssetType;
  assetId: string;
  canEditPermissions: boolean;
  onUpdateWorkspacePermissions: (role: WorkspaceShareRole | null) => void;
}

export const WorkspaceShareSection: React.FC<WorkspaceShareSectionProps> = React.memo(({
  shareAssetConfig,
  canEditPermissions,
  onUpdateWorkspacePermissions
}) => {
  const currentRole = shareAssetConfig.workspace_sharing || 'none';
  
  const selectedLabel = React.useMemo(() => {
    const selectedItem = workspaceShareRoleItems.find(item => item.value === currentRole);
    return selectedItem?.label || 'Not shared';
  }, [currentRole]);

  const onSelectMenuItem = useMemoizedFn((value: string) => {
    onUpdateWorkspacePermissions(value as WorkspaceShareRole);
  });

  const items = React.useMemo(() => {
    return workspaceShareRoleItems.map(item => ({
      ...item,
      selected: item.value === currentRole
    }));
  }, [currentRole]);

  return (
    <div className="flex h-8 items-center justify-between space-x-2 overflow-hidden">
      <div className="flex w-full items-center gap-x-2 rounded-md p-1">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 text-md">
          <ApartmentBuilding />
        </div>
        <div className="flex w-full flex-col gap-y-0 overflow-hidden">
          <Text className="truncate">Workspace</Text>
          <Text variant="secondary" size="xs" className="truncate">
            Share with 1,819 members
          </Text>
        </div>
      </div>

      <Dropdown
        items={items}
        disabled={!canEditPermissions}
        footerContent={
          <div className="bg-item-hover flex justify-center overflow-hidden rounded-b p-2 px-2.5">
            <Text variant="secondary" size="xs">
              Sharing cannot override permissions set by your account admins.
            </Text>
          </div>
        }
        footerClassName="p-0!"
        onSelect={onSelectMenuItem}
        sideOffset={16}
        selectType="single"
        align="end"
        side="bottom">
        <Text
          variant="secondary"
          size="xs"
          className={cn(
            'flex! items-center! space-x-1',
            canEditPermissions && 'cursor-pointer'
          )}>
          <span className="truncate">{selectedLabel}</span>
          {canEditPermissions && (
            <span className="text-2xs text-icon-color">
              <ChevronDown />
            </span>
          )}
        </Text>
      </Dropdown>
    </div>
  );
});

WorkspaceShareSection.displayName = 'WorkspaceShareSection'; 