import {
  ListPermissionGroupsResponse,
  ListPermissionUsersResponse,
  useDatasetUpdatePermissionUsers
} from '@/api/buster-rest/datasets';
import { BusterUserAvatar } from '@/components';
import { BusterListColumn, BusterListRowItem, InfiniteListContainer } from '@/components/list';
import { BusterInfiniteList } from '@/components/list/BusterInfiniteList';
import { useMemoizedFn } from 'ahooks';
import { Select } from 'antd';
import React, { useMemo, useState } from 'react';
import { Text } from '@/components/text';
import { PermissionUsersSelectedPopup } from './PermissionUsersSelectedPopup';
import { PERMISSION_USERS_OPTIONS } from './config';
import { BusterRoutes, createBusterRoute } from '@/routes';

export const PermissionListUsersContainer: React.FC<{
  filteredPermissionUsers: ListPermissionUsersResponse[];
  datasetId: string;
}> = React.memo(({ filteredPermissionUsers, datasetId }) => {
  const { mutateAsync: updatePermissionUsers } = useDatasetUpdatePermissionUsers(datasetId);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const numberOfPermissionUsers = filteredPermissionUsers.length;

  const onSelectAssigned = useMemoizedFn(async (params: { id: string; assigned: boolean }) => {
    updatePermissionUsers([params]);
  });

  const columns: BusterListColumn[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        width: 270,
        render: (name: string, user: ListPermissionUsersResponse) => {
          return <PermissionGroupInfoCell name={name} email={user.email} />;
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

  const { cannotQueryPermissionUsers, canQueryPermissionUsers } = useMemo(() => {
    const result: {
      cannotQueryPermissionUsers: BusterListRowItem[];
      canQueryPermissionUsers: BusterListRowItem[];
    } = filteredPermissionUsers.reduce<{
      cannotQueryPermissionUsers: BusterListRowItem[];
      canQueryPermissionUsers: BusterListRowItem[];
    }>(
      (acc, permissionUser) => {
        const user: BusterListRowItem = {
          id: permissionUser.id,
          data: permissionUser,
          link: createBusterRoute({
            route: BusterRoutes.APP_SETTINGS_USERS_ID,
            userId: permissionUser.id
          })
        };
        if (permissionUser.assigned) {
          acc.canQueryPermissionUsers.push(user);
        } else {
          acc.cannotQueryPermissionUsers.push(user);
        }
        return acc;
      },
      {
        cannotQueryPermissionUsers: [] as BusterListRowItem[],
        canQueryPermissionUsers: [] as BusterListRowItem[]
      }
    );
    return result;
  }, [filteredPermissionUsers]);

  const rows = useMemo(
    () =>
      [
        {
          id: 'header-assigned',
          data: {},
          hidden: canQueryPermissionUsers.length === 0,
          rowSection: {
            title: 'Assigned',
            secondaryTitle: canQueryPermissionUsers.length.toString()
          }
        },
        ...canQueryPermissionUsers,
        {
          id: 'header-not-assigned',
          data: {},
          hidden: cannotQueryPermissionUsers.length === 0,
          rowSection: {
            title: 'Not Assigned',
            secondaryTitle: cannotQueryPermissionUsers.length.toString()
          }
        },
        ...cannotQueryPermissionUsers
      ].filter((row) => !(row as any).hidden),
    [canQueryPermissionUsers, cannotQueryPermissionUsers, numberOfPermissionUsers]
  );

  return (
    <InfiniteListContainer
      popupNode={
        <PermissionUsersSelectedPopup
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
        useRowClickSelectChange={false}
        emptyState={<EmptyState />}
      />
    </InfiniteListContainer>
  );
});

PermissionListUsersContainer.displayName = 'PermissionListUsersContainer';

const PermissionGroupInfoCell = React.memo(({ name, email }: { name: string; email: string }) => {
  return (
    <div className="flex w-full items-center space-x-1.5">
      <div className="flex items-center space-x-2">
        <BusterUserAvatar size={18} name={name} />
      </div>

      <div className="flex flex-col space-y-0">
        <Text>{name}</Text>
        {email && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {email}
          </Text>
        )}
      </div>
    </div>
  );
});
PermissionGroupInfoCell.displayName = 'PermissionGroupInfoCell';

const PermissionGroupAssignedCell: React.FC<{
  id: string;
  assigned: boolean;
  onSelect: (value: { id: string; assigned: boolean }) => void;
}> = ({ id, assigned, onSelect }) => {
  return (
    <Select
      options={PERMISSION_USERS_OPTIONS}
      value={assigned}
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
};

const EmptyState = React.memo(() => {
  return (
    <div className="py-12">
      <Text type="tertiary">No users found</Text>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';
