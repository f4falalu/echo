import {
  BusterUserTeamListItem,
  TeamRole,
  useUpdateUserDatasets,
  useUpdateUserTeams,
  type BusterUserPermissionGroup
} from '@/api/buster-rest';
import { PermissionAssignTeamRole } from '@appComponents/PermissionComponents';
import {
  BusterInfiniteList,
  BusterListColumn,
  BusterListRowItem,
  EmptyStateList,
  InfiniteListContainer
} from '@/components/list';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useMemoizedFn, useWhyDidYouUpdate } from 'ahooks';
import React, { useMemo, useState } from 'react';

export const UserTeamsListContainer: React.FC<{
  filteredTeams: BusterUserTeamListItem[];
  userId: string;
}> = React.memo(({ filteredTeams, userId }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const { mutateAsync: updateUserTeams } = useUpdateUserTeams({
    userId: userId
  });

  const onRoleChange = useMemoizedFn(async (params: { id: string; role: TeamRole }) => {
    await updateUserTeams([params]);
  });

  const columns: BusterListColumn[] = useMemo(
    () => [
      {
        title: 'Name',
        dataIndex: 'name',
        width: 270
      },
      {
        title: 'Role',
        dataIndex: 'assigned',
        render: (assigned: boolean, permissionGroup: BusterUserTeamListItem) => {
          return (
            <div className="flex justify-end">
              <PermissionAssignTeamRole
                role={permissionGroup.role}
                id={permissionGroup.id}
                onRoleChange={onRoleChange}
              />
            </div>
          );
        }
      }
    ],
    []
  );

  const { managerTeams, memberTeams, notAMemberTeams } = useMemo(() => {
    const result: {
      managerTeams: BusterListRowItem[];
      memberTeams: BusterListRowItem[];
      notAMemberTeams: BusterListRowItem[];
    } = filteredTeams.reduce<{
      managerTeams: BusterListRowItem[];
      memberTeams: BusterListRowItem[];
      notAMemberTeams: BusterListRowItem[];
    }>(
      (acc, team) => {
        const teamItem: BusterListRowItem = {
          id: team.id,
          data: team,
          link: createBusterRoute({
            route: BusterRoutes.APP_SETTINGS_USERS_ID,
            userId: team.id
          })
        };
        if (team.role === 'manager') {
          acc.managerTeams.push(teamItem);
        } else if (team.role === 'member') {
          acc.memberTeams.push(teamItem);
        } else {
          acc.notAMemberTeams.push(teamItem);
        }
        return acc;
      },
      {
        managerTeams: [] as BusterListRowItem[],
        memberTeams: [] as BusterListRowItem[],
        notAMemberTeams: [] as BusterListRowItem[]
      }
    );
    return result;
  }, [filteredTeams]);

  const rows = useMemo(
    () =>
      [
        {
          id: 'header-manager',
          data: {},
          hidden: managerTeams.length === 0,
          rowSection: {
            title: 'Manager',
            secondaryTitle: managerTeams.length.toString()
          }
        },
        ...managerTeams,
        {
          id: 'header-member',
          data: {},
          hidden: memberTeams.length === 0,
          rowSection: {
            title: 'Member',
            secondaryTitle: memberTeams.length.toString()
          }
        },
        ...memberTeams,
        {
          id: 'header-not-assigned',
          data: {},
          hidden: notAMemberTeams.length === 0,
          rowSection: {
            title: 'Not a member',
            secondaryTitle: notAMemberTeams.length.toString()
          }
        },
        ...notAMemberTeams
      ].filter((row) => !(row as any).hidden),
    [managerTeams, memberTeams, notAMemberTeams]
  );

  return (
    <InfiniteListContainer
    // popupNode={
    //   <PermissionDatasetGroupSelectedPopup
    //     selectedRowKeys={selectedRowKeys}
    //     onSelectChange={setSelectedRowKeys}
    //     datasetId={datasetId}
    //   />
    // }
    >
      <BusterInfiniteList
        columns={columns}
        rows={rows}
        showHeader={false}
        showSelectAll={false}
        useRowClickSelectChange={true}
        selectedRowKeys={selectedRowKeys}
        onSelectChange={setSelectedRowKeys}
        emptyState={<EmptyStateList text="No datasets found" />}
      />
    </InfiniteListContainer>
  );
});

UserTeamsListContainer.displayName = 'UserTeamsListContainer';
