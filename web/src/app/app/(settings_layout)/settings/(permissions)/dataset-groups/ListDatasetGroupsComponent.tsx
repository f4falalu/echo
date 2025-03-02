import {
  BusterInfiniteList,
  BusterListColumn,
  BusterListRowItem,
  EmptyStateList,
  InfiniteListContainer
} from '@/components/ui/list';
import React, { useMemo } from 'react';
import { BusterRoutes, createBusterRoute } from '@/routes';
import type { DatasetGroup } from '@/api/asset_interfaces';

export const ListDatasetGroupsComponent: React.FC<{
  datasetGroups: DatasetGroup[];
  isFetched: boolean;
}> = React.memo(({ datasetGroups, isFetched }) => {
  const columns: BusterListColumn[] = useMemo(
    () => [
      {
        title: 'Title',
        dataIndex: 'name'
      }
    ],
    []
  );

  const datasetGroupsRows: BusterListRowItem[] = useMemo(() => {
    return datasetGroups.reduce<BusterListRowItem[]>((acc, datasetGroup) => {
      const rowItem: BusterListRowItem = {
        id: datasetGroup.id,
        data: datasetGroup,
        link: createBusterRoute({
          route: BusterRoutes.SETTINGS_DATASET_GROUPS_ID_DATASETS,
          datasetGroupId: datasetGroup.id
        })
      };
      acc.push(rowItem);
      return acc;
    }, []);
  }, [datasetGroups]);

  return (
    <InfiniteListContainer
      showContainerBorder={false}
      //   popupNode={
      //     <UserListPopupContainer
      //       selectedRowKeys={selectedRowKeys}
      //       onSelectChange={setSelectedRowKeys}
      //     />
      //   }
    >
      <BusterInfiniteList
        columns={columns}
        rows={datasetGroupsRows}
        showHeader={true}
        showSelectAll={false}
        rowClassName="pl-[30px]!"
        emptyState={<EmptyStateList text="No dataset groups found" />}
      />
    </InfiniteListContainer>
  );
});

ListDatasetGroupsComponent.displayName = 'ListDatasetGroupsComponent';
