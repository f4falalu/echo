import React, { useMemo } from 'react';
import { CopyLinkButton } from './CopyLinkButton';
import { BackButton, Button } from '@/components/ui/buttons';
import { AccessDropdown } from './AccessDropdown';
import { useUserConfigContextSelector } from '@/context/Users';
import { ShareRole } from '@/api/asset_interfaces';
import { useMemoizedFn } from '@/hooks';
import { Text } from '@/components/ui/typography';
import { UserGroup } from '@/components/ui/icons';
import { ShareAssetType } from '@/api/asset_interfaces';
import type { ShareRequest } from '@/api/asset_interfaces/shared_interfaces';
import { useGetCollection, useUpdateCollection } from '@/api/buster_rest/collections';
import { useGetMetric, useSaveMetric } from '@/api/buster_rest/metrics';
import { useGetDashboard, useUpdateDashboard } from '@/api/buster_rest/dashboards';

export const ShareWithGroupAndTeam: React.FC<{
  goBack: () => void;
  onCopyLink: () => void;
  assetType: ShareAssetType;
  assetId: string;
}> = ({ assetType, assetId, goBack, onCopyLink }) => {
  const userTeams = useUserConfigContextSelector((state) => state.userTeams);
  const { mutateAsync: onShareDashboard } = useUpdateDashboard();
  const { mutateAsync: onShareMetric } = useSaveMetric();
  const { mutateAsync: onShareCollection } = useUpdateCollection();
  const { data: dashboardResponse } = useGetDashboard(
    assetType === ShareAssetType.DASHBOARD ? assetId : undefined
  );
  const { data: collection } = useGetCollection(
    assetType === ShareAssetType.COLLECTION ? assetId : undefined
  );
  const { data: metric } = useGetMetric(assetType === ShareAssetType.METRIC ? assetId : undefined);

  const onUpdateShareRole = useMemoizedFn(
    async ({ teamId, role }: { teamId: string; role: ShareRole | null }) => {
      const payload: ShareRequest = { id: assetId };
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

      <div />

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

        {userTeams.length === 0 && (
          <div className="flex w-full items-center justify-center p-3">
            <Text variant="secondary">Not currently a member of any teams</Text>
          </div>
        )}

        {!stuffToShow && (
          <div className="flex w-full items-center justify-center p-3">
            <Text variant="secondary">No teams to share with</Text>
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
  return (
    <div className={'flex h-[40px] cursor-pointer items-center justify-between space-x-2 px-3'}>
      <div className="flex items-center space-x-2">
        <Button prefix={<UserGroup />} />

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
