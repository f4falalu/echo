import React, { useMemo, useState } from 'react';
import type { GetPermissionGroupDatasetsResponse } from '@/api/asset_interfaces';
import { useUpdatePermissionGroupDatasets } from '@/api/buster_rest/permission_groups';
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
import { PermissionGroupDatasetSelectedPopup } from './PermissionGroupDatasetSelectedPopup';

export const PermissionGroupDatasetsListContainer: React.FC<{
  filteredDatasets: GetPermissionGroupDatasetsResponse[];
  permissionGroupId: string;
}> = React.memo(({ filteredDatasets, permissionGroupId }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const { mutateAsync: updatePermissionGroupDatasets } = useUpdatePermissionGroupDatasets();

  const onSelectAssigned = useMemoizedFn(async (params: { id: string; assigned: boolean }) => {
    await updatePermissionGroupDatasets({
      permissionGroupId,
      data: [params],
    });
  });

  const columns: BusterListColumn<GetPermissionGroupDatasetsResponse>[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
      },
      {
        title: 'Assigned',
        dataIndex: 'assigned',
        width: 130 + 85,
        render: (assigned, dataset: GetPermissionGroupDatasetsResponse) => {
          return (
            <div className="flex justify-end">
              <PermissionAssignedCell
                id={dataset.id}
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
    const createPermissionGroupDatasetListItem =
      createListItem<GetPermissionGroupDatasetsResponse>();
    const result: {
      cannotQueryPermissionUsers: BusterListRowItem<GetPermissionGroupDatasetsResponse>[];
      canQueryPermissionUsers: BusterListRowItem<GetPermissionGroupDatasetsResponse>[];
    } = filteredDatasets.reduce<{
      cannotQueryPermissionUsers: BusterListRowItem<GetPermissionGroupDatasetsResponse>[];
      canQueryPermissionUsers: BusterListRowItem<GetPermissionGroupDatasetsResponse>[];
    }>(
      (acc, dataset) => {
        const datasetItem: BusterListRowItem<GetPermissionGroupDatasetsResponse> =
          createPermissionGroupDatasetListItem({
            id: dataset.id,
            data: dataset,
            link: {
              to: '/app/settings/datasets/$datasetId',
              params: {
                datasetId: dataset.id,
              },
            },
          });
        if (dataset.assigned) {
          acc.canQueryPermissionUsers.push(datasetItem);
        } else {
          acc.cannotQueryPermissionUsers.push(datasetItem);
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

  const rows: BusterListRowItem<GetPermissionGroupDatasetsResponse>[] = useMemo(
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

  return (
    <InfiniteListContainer
      popupNode={
        <PermissionGroupDatasetSelectedPopup
          selectedRowKeys={selectedRowKeys}
          onSelectChange={setSelectedRowKeys}
          permissionGroupId={permissionGroupId}
        />
      }
    >
      <BusterInfiniteList
        columns={columns}
        rows={rows}
        showHeader={false}
        showSelectAll={false}
        useRowClickSelectChange={false}
        selectedRowKeys={selectedRowKeys}
        onSelectChange={setSelectedRowKeys}
        emptyState={useMemo(() => <EmptyStateList text="No dataset groups found" />, [])}
      />
    </InfiniteListContainer>
  );
});

PermissionGroupDatasetsListContainer.displayName = 'PermissionGroupUsersListContainer';
