import React, { useMemo, useState } from 'react';
import type { BusterUserDataset } from '@/api/asset_interfaces';
import { useUpdateUserDatasets } from '@/api/buster_rest/users/permissions';
import { PermissionAssignedCell } from '@/components/features/permissions';
import {
  type BusterListColumn,
  type BusterListRowItem,
  createListItem,
  EmptyStateList,
  InfiniteListContainer,
} from '@/components/ui/list';
import { BusterInfiniteList } from '@/components/ui/list/BusterInfiniteList';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { UserDatasetsSelectedPopup } from './UserDatasetsSelectedPopup';

export const UserDatasetsListContainer: React.FC<{
  filteredDatasets: BusterUserDataset[];
  userId: string;
}> = React.memo(({ filteredDatasets, userId }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const { mutateAsync: updateUserDatasets } = useUpdateUserDatasets({
    userId: userId,
  });

  const onSelectAssigned = useMemoizedFn(async (params: { id: string; assigned: boolean }) => {
    await updateUserDatasets([params]);
  });

  const columns: BusterListColumn<BusterUserDataset>[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
      },
      {
        title: 'Assigned',
        dataIndex: 'assigned',
        width: 130,
        render: (assigned, permissionGroup) => {
          return (
            <div className="flex justify-end">
              <PermissionAssignedCell
                id={permissionGroup.id}
                assigned={assigned}
                text="assigned"
                onSelect={onSelectAssigned}
              />
            </div>
          );
        },
      },
    ],
    []
  );

  const { cannotQueryPermissionUsers, canQueryPermissionUsers } = useMemo(() => {
    const createDatasetListItem = createListItem<BusterUserDataset>();
    const result: {
      cannotQueryPermissionUsers: BusterListRowItem<BusterUserDataset>[];
      canQueryPermissionUsers: BusterListRowItem<BusterUserDataset>[];
    } = filteredDatasets.reduce<{
      cannotQueryPermissionUsers: BusterListRowItem<BusterUserDataset>[];
      canQueryPermissionUsers: BusterListRowItem<BusterUserDataset>[];
    }>(
      (acc, dataset) => {
        const user: BusterListRowItem<BusterUserDataset> = createDatasetListItem({
          id: dataset.id,
          data: dataset,
          link: {
            to: '/app/datasets/$datasetId/overview',
            params: {
              datasetId: dataset.id,
            },
          },
        });
        if (dataset.assigned) {
          acc.canQueryPermissionUsers.push(user);
        } else {
          acc.cannotQueryPermissionUsers.push(user);
        }
        return acc;
      },
      {
        cannotQueryPermissionUsers: [],
        canQueryPermissionUsers: [],
      }
    );
    return result;
  }, [filteredDatasets]);

  const rows: BusterListRowItem<BusterUserDataset>[] = useMemo(
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
    [canQueryPermissionUsers, cannotQueryPermissionUsers]
  );

  const MemoizedPopup = useMemo(
    () => (
      <UserDatasetsSelectedPopup
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
        emptyState={useMemo(() => <EmptyStateList text="No datasets found" />, [])}
      />
    </InfiniteListContainer>
  );
});

UserDatasetsListContainer.displayName = 'UserDatasetsListContainer';
