import React, { useMemo } from 'react';
import { CopyLinkButton } from './CopyLinkButton';
import { Button, Divider } from 'antd';
import { AppMaterialIcons, BackButton } from '@/components';
import { useStyles } from './useStyles';
import { AccessDropdown } from './AccessDropdown';
import { useUserConfigContextSelector } from '@/context/Users';
import { ShareRole } from '@/api/asset_interfaces';
import {
  useBusterDashboardContextSelector,
  useBusterDashboardIndividual
} from '@/context/Dashboards';
import type { ShareRequest } from '@/api/buster_socket';
import { useMemoizedFn } from 'ahooks';
import { Text } from '@/components';
import { ShareAssetType } from '@/api/asset_interfaces';
import { useBusterMetricsIndividualContextSelector } from '@/context/Metrics';
import {
  useBusterCollectionIndividualContextSelector,
  useCollectionIndividual
} from '@/context/Collections';

export const ShareWithGroupAndTeam: React.FC<{
  goBack: () => void;
  onCopyLink: () => void;
  assetType: ShareAssetType;
  assetId: string;
}> = ({ assetType, assetId, goBack, onCopyLink }) => {
  const userTeams = useUserConfigContextSelector((state) => state.userTeams);
  const loadedUserTeams = useUserConfigContextSelector((state) => state.loadedUserTeams);
  const onShareMetric = useBusterMetricsIndividualContextSelector((state) => state.onShareMetric);
  const getMetric = useBusterMetricsIndividualContextSelector((state) => state.getMetricMemoized);
  const onShareDashboard = useBusterDashboardContextSelector((state) => state.onShareDashboard);
  const onShareCollection = useBusterCollectionIndividualContextSelector(
    (x) => x.onShareCollection
  );

  const { dashboardResponse } = useBusterDashboardIndividual({
    dashboardId: assetType === ShareAssetType.DASHBOARD ? assetId : undefined
  });
  const { collection } = useCollectionIndividual({
    collectionId: assetType === ShareAssetType.COLLECTION ? assetId : undefined
  });

  const metric = useMemo(
    () =>
      assetType === ShareAssetType.METRIC && assetId ? getMetric({ metricId: assetId }) : null,
    [assetType, assetId]
  );

  const onUpdateShareRole = useMemoizedFn(
    async ({ teamId, role }: { teamId: string; role: ShareRole | null }) => {
      let payload: ShareRequest = { id: assetId };
      if (!role) {
        payload.remove_teams = [teamId];
      } else {
        payload.team_permissions = [{ team_id: teamId, role }];
      }
      if (assetType === ShareAssetType.METRIC) {
        await onShareMetric(payload);
      } else if (assetType === ShareAssetType.DASHBOARD) {
        await onShareDashboard(payload);
      } else if (assetType === ShareAssetType.COLLECTION) {
        await onShareCollection(payload);
      }
    }
  );

  const listedTeam: { id: string; name: string; role: ShareRole | null }[] = useMemo(() => {
    const assosciatedPermissiongSearch = (teamId: string) => {
      if (assetType === ShareAssetType.METRIC && metric) {
        return metric.team_permissions?.find((t) => t.id === teamId);
      } else if (assetType === ShareAssetType.DASHBOARD && dashboardResponse) {
        return dashboardResponse.team_permissions?.find((t) => t.id === teamId);
      } else if (assetType === ShareAssetType.COLLECTION && collection) {
        return collection.team_permissions?.find((t) => t.id === teamId);
      }
    };
    return userTeams.reduce<{ id: string; name: string; role: ShareRole | null }[]>((acc, team) => {
      const assosciatedPermission = assosciatedPermissiongSearch(team.id);
      acc.push({
        id: team.id,
        name: team.name,
        role: assosciatedPermission?.role || null
      });

      return acc;
    }, []);
  }, [userTeams, dashboardResponse, metric, assetId, collection, assetType]);

  const stuffToShow = listedTeam.length > 0 || userTeams.length === 0;

  return (
    <div className="">
      <div className="flex h-[40px] items-center justify-between space-x-1 px-3">
        <BackButton onClick={goBack} />
        <div>
          <CopyLinkButton onCopyLink={onCopyLink} />
        </div>
      </div>

      <Divider />

      <div className="">
        {listedTeam.map((team) => (
          <ShareOption
            key={team.id}
            title={userTeams.length > 1 ? team.name : 'Your team'}
            role={team.role}
            onUpdateShareRole={(role) => {
              onUpdateShareRole({
                teamId: team.id,
                role
              });
            }}
          />
        ))}

        {userTeams.length === 0 && !loadedUserTeams && (
          <div className="flex w-full items-center justify-center p-3">
            <Text type="secondary">
              {loadedUserTeams ? 'Not currently a member of any teams' : 'Loading teams...'}
            </Text>
          </div>
        )}

        {!stuffToShow && (
          <div className="flex w-full items-center justify-center p-3">
            <Text type="secondary">No teams to share with</Text>
          </div>
        )}
      </div>
    </div>
  );
};

const ShareOption: React.FC<{
  title: string;
  onUpdateShareRole: (role: ShareRole | null) => void;
  role: ShareRole | null;
}> = ({ onUpdateShareRole, title, role }) => {
  const { cx } = useStyles();

  return (
    <div
      className={cx(
        'flex h-[40px] cursor-pointer items-center justify-between space-x-2 px-3'
        //   styles.hoverListItem
      )}>
      <div className="flex items-center space-x-2">
        <Button shape="circle" icon={<AppMaterialIcons icon={'groups_2'} size={14} />} />

        <Text>{title}</Text>
      </div>

      <div>
        <AccessDropdown
          groupShare
          shareLevel={role}
          onChangeShareLevel={(v) => {
            onUpdateShareRole(v);
          }}
        />
      </div>
    </div>
  );
};
