import React, { useMemo } from 'react';
import type { ListPermissionGroupsResponse } from '@/api/asset_interfaces';
import {
  type BusterListColumn,
  type BusterListRowItem,
  createListItem,
  EmptyStateList,
  InfiniteListContainer,
} from '@/components/ui/list';
import { BusterInfiniteList } from '@/components/ui/list/BusterInfiniteList';

export const ListPermissionGroupsComponent: React.FC<{
  permissionGroups: ListPermissionGroupsResponse[];
  isFetched: boolean;
}> = React.memo(({ permissionGroups }) => {
  const columns: BusterListColumn<ListPermissionGroupsResponse>[] = useMemo(
    () => [
      {
        title: 'Title',
        dataIndex: 'name',
      },
    ],
    []
  );

  const permissionGroupsRows: BusterListRowItem<ListPermissionGroupsResponse>[] = useMemo(() => {
    const createPermissionGroupListItem = createListItem<ListPermissionGroupsResponse>();
    return permissionGroups.reduce<BusterListRowItem<ListPermissionGroupsResponse>[]>(
      (acc, permissionGroup) => {
        const rowItem: BusterListRowItem<ListPermissionGroupsResponse> =
          createPermissionGroupListItem({
            id: permissionGroup.id,
            data: permissionGroup,
            link: {
              to: '/app/settings/permission-groups/$permissionGroupId/users',
              params: {
                permissionGroupId: permissionGroup.id,
              },
            },
          });
        acc.push(rowItem);
        return acc;
      },
      []
    );
  }, [permissionGroups]);

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
        rows={permissionGroupsRows}
        showHeader={true}
        showSelectAll={false}
        rowClassName="pl-[30px]!"
        emptyState={useMemo(() => <EmptyStateList text="No permission groups found" />, [])}
      />
    </InfiniteListContainer>
  );
});

ListPermissionGroupsComponent.displayName = 'ListPermissionGroupsComponent';
