import React, { useMemo, useState } from 'react';
import type {
  GetDatasetGroupPermissionGroupsResponse,
  GetPermissionGroupDatasetGroupsResponse,
} from '@/api/asset_interfaces';
import { useUpdateDatasetGroupPermissionGroups } from '@/api/buster_rest/dataset_groups';
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
import { DatasetGroupPermissionGroupSelectedPopup } from './DatasetGroupPermissionGroupSelectedPopup';

export const DatasetGroupPermissionGroupsListContainer: React.FC<{
  filteredDatasetGroups: GetDatasetGroupPermissionGroupsResponse[];
  datasetGroupId: string;
}> = React.memo(({ filteredDatasetGroups, datasetGroupId }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const { mutateAsync: updateDatasetGroupDatasetGroups } = useUpdateDatasetGroupPermissionGroups();

  const onSelectAssigned = useMemoizedFn(async (params: { id: string; assigned: boolean }) => {
    await updateDatasetGroupDatasetGroups({
      datasetGroupId,
      data: [params],
    });
  });

  const columns: BusterListColumn<GetDatasetGroupPermissionGroupsResponse>[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
      },
      {
        title: 'Assigned',
        dataIndex: 'assigned',
        width: 130 + 85,
        render: (assigned, datasetGroup) => {
          return (
            <div className="flex justify-end">
              <PermissionAssignedCell
                id={datasetGroup.id}
                assigned={assigned as boolean}
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

  const { cannotQueryPermissionDatasetGroups, canQueryPermissionDatasetGroups } = useMemo(() => {
    const createDatasetGroupPermissionGroupListItem =
      createListItem<GetDatasetGroupPermissionGroupsResponse>();
    const result: {
      cannotQueryPermissionDatasetGroups: BusterListRowItem<GetDatasetGroupPermissionGroupsResponse>[];
      canQueryPermissionDatasetGroups: BusterListRowItem<GetDatasetGroupPermissionGroupsResponse>[];
    } = filteredDatasetGroups.reduce<{
      cannotQueryPermissionDatasetGroups: BusterListRowItem<GetDatasetGroupPermissionGroupsResponse>[];
      canQueryPermissionDatasetGroups: BusterListRowItem<GetDatasetGroupPermissionGroupsResponse>[];
    }>(
      (acc, datasetGroup) => {
        const datasetGroupItem: BusterListRowItem<GetDatasetGroupPermissionGroupsResponse> =
          createDatasetGroupPermissionGroupListItem({
            id: datasetGroup.id,
            data: datasetGroup,
            link: {
              to: '/app/settings/permission-groups/$permissionGroupId/dataset-groups',
              params: {
                permissionGroupId: datasetGroup.id,
              },
            },
          });

        if (datasetGroup.assigned) {
          acc.canQueryPermissionDatasetGroups.push(datasetGroupItem);
        } else {
          acc.cannotQueryPermissionDatasetGroups.push(datasetGroupItem);
        }
        return acc;
      },
      {
        cannotQueryPermissionDatasetGroups: [],
        canQueryPermissionDatasetGroups: [],
      }
    );
    return result;
  }, [filteredDatasetGroups]);

  const rows: BusterListRowItem<GetDatasetGroupPermissionGroupsResponse>[] = useMemo(
    () => [
      {
        id: 'header-assigned',
        data: null,
        hidden: canQueryPermissionDatasetGroups.length === 0,
        rowSection: {
          title: 'Assigned',
          secondaryTitle: canQueryPermissionDatasetGroups.length.toString(),
        },
      },
      ...canQueryPermissionDatasetGroups,
      {
        id: 'header-not-assigned',
        data: null,
        hidden: cannotQueryPermissionDatasetGroups.length === 0,
        rowSection: {
          title: 'Not assigned',
          secondaryTitle: cannotQueryPermissionDatasetGroups.length.toString(),
        },
      },
      ...cannotQueryPermissionDatasetGroups,
    ],
    [canQueryPermissionDatasetGroups, cannotQueryPermissionDatasetGroups]
  );

  return (
    <InfiniteListContainer
      popupNode={
        <DatasetGroupPermissionGroupSelectedPopup
          selectedRowKeys={selectedRowKeys}
          onSelectChange={setSelectedRowKeys}
          datasetGroupId={datasetGroupId}
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
        emptyState={useMemo(() => <EmptyStateList text="No permission groups found" />, [])}
      />
    </InfiniteListContainer>
  );
});
DatasetGroupPermissionGroupsListContainer.displayName = 'DatasetGroupPermissionGroupsListContainer';
