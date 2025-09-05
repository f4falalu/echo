import React, { useMemo } from 'react';
import type { DatasetGroup } from '@/api/asset_interfaces';
import {
  type BusterListColumn,
  type BusterListRowItem,
  createListItem,
  EmptyStateList,
  InfiniteListContainer,
} from '@/components/ui/list';
import { BusterInfiniteList } from '@/components/ui/list/BusterInfiniteList';

export const ListDatasetGroupsComponent: React.FC<{
  datasetGroups: DatasetGroup[];
  isFetched: boolean;
}> = React.memo(({ datasetGroups }) => {
  const columns: BusterListColumn<DatasetGroup>[] = useMemo(
    () => [
      {
        title: 'Title',
        dataIndex: 'name',
      },
    ],
    []
  );

  const datasetGroupsRows: BusterListRowItem<DatasetGroup>[] = useMemo(() => {
    const createDatasetGroupListItem = createListItem<DatasetGroup>();
    return datasetGroups.map((datasetGroup) =>
      createDatasetGroupListItem({
        id: datasetGroup.id,
        data: datasetGroup,
        link: {
          to: '/app/settings/dataset-groups/$datasetGroupId/datasets',
          params: {
            datasetGroupId: datasetGroup.id,
          },
        },
      })
    );
  }, [datasetGroups]);

  const emptyStateComponent = useMemo(() => <EmptyStateList text="No dataset groups found" />, []);

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
        emptyState={emptyStateComponent}
      />
    </InfiniteListContainer>
  );
});

ListDatasetGroupsComponent.displayName = 'ListDatasetGroupsComponent';
