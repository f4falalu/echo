import pluralize from 'pluralize';
import React, { useMemo, useState } from 'react';
import type { BusterUserPermissionGroup } from '@/api/asset_interfaces';
import { useUpdateUserPermissionGroups } from '@/api/buster_rest/users/permissions';
import { PermissionAssignedCell } from '@/components/features/permissions';
import {
  type BusterListColumn,
  type BusterListRowItem,
  createListItem,
  EmptyStateList,
  InfiniteListContainer,
} from '@/components/ui/list';
import { BusterInfiniteList } from '@/components/ui/list/BusterInfiniteList';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { UserPermissionGroupSelectedPopup } from './UserPermissionGroupSelectedPopup';

export const UserPermissionGroupsListContainer: React.FC<{
  filteredPermissionGroups: BusterUserPermissionGroup[];
  userId: string;
}> = React.memo(({ filteredPermissionGroups, userId }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const { mutateAsync: updateUserPermissionGroups } = useUpdateUserPermissionGroups({
    userId: userId,
  });
  const numberOfPermissionGroups = filteredPermissionGroups.length;

  const onSelectAssigned = useMemoizedFn(async (params: { id: string; assigned: boolean }) => {
    await updateUserPermissionGroups([params]);
  });

  const columns: BusterListColumn<BusterUserPermissionGroup>[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
      },
      {
        title: 'Assigned',
        dataIndex: 'assigned',
        width: 130 + 145,
        render: (assigned, permissionGroup) => {
          const { dataset_count } = permissionGroup;
          return (
            <div className="flex justify-end">
              <PermissionAssignedCell
                id={permissionGroup.id}
                assigned={assigned}
                text="assigned"
                onSelect={onSelectAssigned}
              >
                <Text variant="secondary">{`${dataset_count} ${pluralize('datasets', dataset_count)}`}</Text>
              </PermissionAssignedCell>
            </div>
          );
        },
      },
    ],
    []
  );

  const { cannotQueryPermissionUsers, canQueryPermissionUsers } = useMemo(() => {
    const createPermissionGroupListItem = createListItem<BusterUserPermissionGroup>();
    const result: {
      cannotQueryPermissionUsers: BusterListRowItem<BusterUserPermissionGroup>[];
      canQueryPermissionUsers: BusterListRowItem<BusterUserPermissionGroup>[];
    } = filteredPermissionGroups.reduce<{
      cannotQueryPermissionUsers: BusterListRowItem<BusterUserPermissionGroup>[];
      canQueryPermissionUsers: BusterListRowItem<BusterUserPermissionGroup>[];
    }>(
      (acc, permissionGroup) => {
        const permissionGroupItem: BusterListRowItem<BusterUserPermissionGroup> =
          createPermissionGroupListItem({
            id: permissionGroup.id,
            data: permissionGroup,
            // link: createBusterRoute({
            //   route: BusterRoutes.SETTINGS_PERMISSION_GROUPS_ID_DATASETS,
            //   permissionGroupId: permissionGroup.id,
            // }),
            link: {
              to: '/app/settings/permission-groups/$permissionGroupId/dataset-groups',
              params: {
                permissionGroupId: permissionGroup.id,
              },
            },
          });
        if (permissionGroup.assigned) {
          acc.canQueryPermissionUsers.push(permissionGroupItem);
        } else {
          acc.cannotQueryPermissionUsers.push(permissionGroupItem);
        }
        return acc;
      },
      {
        cannotQueryPermissionUsers: [],
        canQueryPermissionUsers: [],
      }
    );
    return result;
  }, [filteredPermissionGroups]);

  const rows: BusterListRowItem<BusterUserPermissionGroup>[] = useMemo(
    () => [
      {
        id: 'header-assigned',
        data: null,
        hidden: canQueryPermissionUsers.length === 0,
        rowSection: {
          title: 'Assigned',
          secondaryTitle: canQueryPermissionUsers.length.toString(),
        },
      },
      ...canQueryPermissionUsers,
      {
        id: 'header-not-assigned',
        data: null,
        hidden: cannotQueryPermissionUsers.length === 0,
        rowSection: {
          title: 'Not assigned',
          secondaryTitle: cannotQueryPermissionUsers.length.toString(),
        },
      },
      ...cannotQueryPermissionUsers,
    ],
    [canQueryPermissionUsers, cannotQueryPermissionUsers, numberOfPermissionGroups]
  );

  const MemoizedPopup = useMemo(
    () => (
      <UserPermissionGroupSelectedPopup
        selectedRowKeys={selectedRowKeys}
        onSelectChange={setSelectedRowKeys}
        userId={userId}
      />
    ),
    [selectedRowKeys, userId]
  );

  return (
    <InfiniteListContainer popupNode={MemoizedPopup}>
      <BusterInfiniteList
        columns={columns}
        rows={rows}
        showHeader={false}
        showSelectAll={false}
        useRowClickSelectChange={false}
        selectedRowKeys={selectedRowKeys}
        onSelectChange={setSelectedRowKeys}
        emptyState={useMemo(() => <EmptyStateList text="No permission groups found" />, [])}
      />
    </InfiniteListContainer>
  );
});

UserPermissionGroupsListContainer.displayName = 'UserPermissionGroupsListContainer';
