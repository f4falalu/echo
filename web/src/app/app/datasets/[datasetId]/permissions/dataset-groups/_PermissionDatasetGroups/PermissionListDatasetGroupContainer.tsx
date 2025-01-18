import { ListDatasetGroupsResponse, useDatasetUpdateDatasetGroups } from '@/api/buster-rest';
import { BusterListColumn, BusterListRowItem } from '@/components/list';
import { BusterInfiniteList } from '@/components/list/BusterInfiniteList';
import { useMemoizedFn } from 'ahooks';
import { Select } from 'antd';
import { createStyles } from 'antd-style';
import React, { useMemo, useState } from 'react';
import { PermissionDatasetGroupSelectedPopup } from './PermissionDatasetGroupSelectedPopup';
import { PermissionListContainer } from '../../_components';

export const PermissionListDatasetGroupContainer: React.FC<{
  filteredPermissionGroups: ListDatasetGroupsResponse[];
  datasetId: string;
}> = ({ filteredPermissionGroups, datasetId }) => {
  const { mutateAsync: updateDatasetGroups } = useDatasetUpdateDatasetGroups(datasetId);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const numberOfPermissionGroups = filteredPermissionGroups.length;

  const onSelectAssigned = useMemoizedFn(async (params: { id: string; assigned: boolean }) => {
    await updateDatasetGroups([params]);
  });

  const columns: BusterListColumn[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        width: 270,
        render: (name: string) => {
          return <DatasetGroupInfoCell name={name} />;
        }
      },
      {
        title: 'Assigned',
        dataIndex: 'assigned',
        render: (assigned: boolean, datasetGroup: ListDatasetGroupsResponse) => {
          return (
            <div className="flex justify-end">
              <DatasetGroupAssignedCell
                id={datasetGroup.id}
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
        <PermissionDatasetGroupSelectedPopup
          selectedRowKeys={selectedRowKeys}
          onSelectChange={setSelectedRowKeys}
          datasetId={datasetId}
        />
      }>
      <BusterInfiniteList
        columns={columns}
        rows={rows}
        showHeader={false}
        showSelectAll={false}
        useRowClickSelectChange={true}
        selectedRowKeys={selectedRowKeys}
        onSelectChange={setSelectedRowKeys}
        emptyState={<div className="py-12">No dataset groups found</div>}
      />
    </PermissionListContainer>
  );
};

const DatasetGroupInfoCell: React.FC<{ name: string }> = ({ name }) => {
  return <div>{name}</div>;
};

const options = [
  {
    label: 'Included',
    value: true
  },
  {
    label: 'Not Included',
    value: false
  }
];

const DatasetGroupAssignedCell: React.FC<{
  id: string;
  assigned: boolean;
  onSelect: (params: { id: string; assigned: boolean }) => Promise<void>;
}> = React.memo(({ id, assigned, onSelect }) => {
  return (
    <Select
      options={options}
      value={assigned || false}
      popupMatchSelectWidth
      onSelect={(value) => {
        onSelect({ id, assigned: value });
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    />
  );
});

DatasetGroupAssignedCell.displayName = 'DatasetGroupAssignedCell';
