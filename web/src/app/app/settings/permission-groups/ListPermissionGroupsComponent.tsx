import {
  BusterInfiniteList,
  BusterListColumn,
  BusterListRowItem,
  EmptyStateList,
  InfiniteListContainer
} from '@/components/list';
import { Card } from 'antd';
import React, { useMemo, useState } from 'react';
import { Text } from '@/components/text';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { ListUserItem } from '../../_components/ListContent';
import { GetPermissionGroupResponse } from '@/api/buster-rest';
import { ListEmptyState } from '../../_components/Lists/ListEmptyState';

export const ListPermissionGroupsComponent: React.FC<{
  permissionGroups: GetPermissionGroupResponse[];
  isFetched: boolean;
}> = React.memo(({ permissionGroups, isFetched }) => {
  const columns: BusterListColumn[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name'
      }
    ],
    []
  );

  const permissionGroupsRows: BusterListRowItem[] = useMemo(() => {
    return permissionGroups.reduce<BusterListRowItem[]>((acc, permissionGroup) => {
      const rowItem: BusterListRowItem = {
        id: permissionGroup.id,
        data: permissionGroup,
        link: createBusterRoute({
          route: BusterRoutes.SETTINGS_PERMISSION_GROUPS_ID_USERS,
          permissionGroupId: permissionGroup.id
        })
      };
      acc.push(rowItem);
      return acc;
    }, []);
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
        rowClassName="!pl-[30px]"
        columnRowVariant="default"
        emptyState={<EmptyStateList text="No permission groups found" />}
      />
    </InfiniteListContainer>
  );
});

ListPermissionGroupsComponent.displayName = 'ListPermissionGroupsComponent';
