import {
  ListPermissionGroupsResponse,
  useDatasetUpdatePermissionGroups
} from '@/api/buster-rest/datasets';
import { BusterListColumn, BusterListRowItem } from '@/components/list';
import { useMemoizedFn } from 'ahooks';
import { Select } from 'antd';
import React, { useMemo, useState } from 'react';
import { Text } from '@/components/text';
import { PermissionGroupSelectedPopup } from './PermissionGroupSelectedPopup';
import { BusterInfiniteList } from '@/components/list/BusterInfiniteList';
import { PERMISSION_GROUP_ASSIGNED_OPTIONS } from './config';
import { PermissionListContainer } from '../../_components/PermissionListContainer';

export const PermissionListPermissionGroupContainer: React.FC<{
  filteredPermissionGroups: ListPermissionGroupsResponse[];
  datasetId: string;
}> = React.memo(({ filteredPermissionGroups, datasetId }) => {
  const { mutateAsync: updatePermissionGroups } = useDatasetUpdatePermissionGroups(datasetId);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const numberOfPermissionGroups = filteredPermissionGroups.length;

  const onSelectAssigned = useMemoizedFn(async (params: { id: string; assigned: boolean }) => {
    updatePermissionGroups([params]);
  });

  const columns: BusterListColumn[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        width: 270,
        render: (name: string) => {
          return <PermissionGroupInfoCell name={name} />;
        }
      },
      {
        title: 'Assigned',
        dataIndex: 'assigned',
        render: (assigned: boolean, permissionGroup: ListPermissionGroupsResponse) => {
          return (
            <div className="flex justify-end">
              <PermissionGroupAssignedCell
                id={permissionGroup.id}
                assigned={assigned}
                onSelect={onSelectAssigned}
              />
            </div>
          );
        }
      }
    ],
    []
  );

  const { cannotQueryPermissionGroups, canQueryPermissionGroups } = useMemo(() => {
    const result: {
      cannotQueryPermissionGroups: BusterListRowItem[];
      canQueryPermissionGroups: BusterListRowItem[];
    } = filteredPermissionGroups.reduce<{
      cannotQueryPermissionGroups: BusterListRowItem[];
      canQueryPermissionGroups: BusterListRowItem[];
    }>(
      (acc, permissionGroup) => {
        if (permissionGroup.assigned) {
          acc.canQueryPermissionGroups.push({
            id: permissionGroup.id,
            data: permissionGroup
          });
        } else {
          acc.cannotQueryPermissionGroups.push({
            id: permissionGroup.id,
            data: permissionGroup
          });
        }
        return acc;
      },
      {
        cannotQueryPermissionGroups: [] as BusterListRowItem[],
        canQueryPermissionGroups: [] as BusterListRowItem[]
      }
    );
    return result;
  }, [filteredPermissionGroups]);

  const rows = useMemo(
    () =>
      [
        {
          id: 'header-assigned',
          data: {},
          hidden: canQueryPermissionGroups.length === 0,
          rowSection: {
            title: 'Assigned',
            secondaryTitle: canQueryPermissionGroups.length.toString()
          }
        },
        ...canQueryPermissionGroups,
        {
          id: 'header-not-assigned',
          data: {},
          hidden: cannotQueryPermissionGroups.length === 0,
          rowSection: {
            title: 'Not Assigned',
            secondaryTitle: cannotQueryPermissionGroups.length.toString()
          }
        },
        ...cannotQueryPermissionGroups
      ].filter((row) => !(row as any).hidden),
    [canQueryPermissionGroups, cannotQueryPermissionGroups, numberOfPermissionGroups]
  );

  return (
    <PermissionListContainer
      popupNode={
        <PermissionGroupSelectedPopup
          datasetId={datasetId}
          selectedRowKeys={selectedRowKeys}
          onSelectChange={setSelectedRowKeys}
        />
      }>
      <BusterInfiniteList
        columns={columns}
        rows={rows}
        showHeader={false}
        showSelectAll={false}
        selectedRowKeys={selectedRowKeys}
        onSelectChange={setSelectedRowKeys}
        emptyState={<EmptyState />}
        useRowClickSelectChange={true}
      />
    </PermissionListContainer>
  );
});

PermissionListPermissionGroupContainer.displayName = 'PermissionListTeamContainer';

const PermissionGroupInfoCell = React.memo(({ name }: { name: string }) => {
  return <div>{name}</div>;
});
PermissionGroupInfoCell.displayName = 'PermissionGroupInfoCell';

export const PermissionGroupAssignedCell = React.memo(
  ({
    id,
    assigned,
    onSelect
  }: {
    id: string;
    assigned: boolean;
    onSelect: (value: { id: string; assigned: boolean }) => void;
  }) => {
    return (
      <Select
        options={PERMISSION_GROUP_ASSIGNED_OPTIONS}
        value={assigned}
        popupMatchSelectWidth
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onSelect={(value) => {
          onSelect({ id, assigned: value });
        }}
      />
    );
  },
  () => true
);

PermissionGroupAssignedCell.displayName = 'PermissionGroupAssignedCell';

const EmptyState = React.memo(() => {
  return (
    <div className="py-12">
      <Text type="tertiary">No permission groups found</Text>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';
