import { BusterShare, ShareRole } from '@/api/asset_interfaces';
import { ShareMenuTopBarOptions } from './ShareMenuTopBar';
import { ShareAssetType } from '@/api/asset_interfaces';
import React from 'react';
import { ShareMenuContentPublish } from './ShareMenuContentPublish';
import { ShareMenuContentEmbed } from './ShareMenuContentEmbed';
import { ShareWithGroupAndTeam } from './ShareWithTeamAndGroup';
import { Text } from '@/components/text';
import { useUserConfigContextSelector } from '@/context/Users';
import { useDashboardContextSelector } from '@/context/Dashboards';
import { useCollectionsContextSelector } from '@/context/Collections';
import { inputHasText } from '@/utils/text';
import { validate } from 'email-validator';
import { useMemoizedFn } from 'ahooks';
import { ShareRequest } from '@/api/buster_socket/dashboards';
import { Button, Divider, Input } from 'antd';
import { AccessDropdown } from './AccessDropdown';
import { IndividualSharePerson } from './IndividualSharePerson';
import { useStyles } from './useStyles';
import { AppMaterialIcons } from '@/components/icons';
import { useBusterMetricsContextSelector } from '@/context/Metrics';

export const ShareMenuContentBody: React.FC<{
  selectedOptions: ShareMenuTopBarOptions;
  setOpenShareWithGroupAndTeam: (open: boolean) => void;
  goBack: () => void;
  onCopyLink: () => void;
  shareAssetConfig: BusterShare;
  assetId: string;
  assetType: ShareAssetType;
}> = React.memo(
  ({
    onCopyLink,
    shareAssetConfig,
    selectedOptions,
    assetId,
    assetType,
    goBack,
    setOpenShareWithGroupAndTeam
  }) => {
    const Component = ContentRecord[selectedOptions];

    const selectedClass = selectedOptions === ShareMenuTopBarOptions.Share ? 'pt-3' : '';
    const individual_permissions = shareAssetConfig.individual_permissions;
    const team_permissions = shareAssetConfig.team_permissions;
    const organization_permissions = shareAssetConfig.organization_permissions;
    const publicly_accessible = shareAssetConfig.publicly_accessible;
    const publicExpirationDate = shareAssetConfig.public_expiry_date;
    const password = shareAssetConfig.public_password;

    return (
      <div className={selectedClass}>
        <Component
          setOpenShareWithGroupAndTeam={setOpenShareWithGroupAndTeam}
          goBack={goBack}
          onCopyLink={onCopyLink}
          individual_permissions={individual_permissions}
          team_permissions={team_permissions}
          organization_permissions={organization_permissions}
          publicly_accessible={publicly_accessible}
          publicExpirationDate={publicExpirationDate}
          password={password}
          assetId={assetId}
          assetType={assetType}
        />
      </div>
    );
  }
);
ShareMenuContentBody.displayName = 'ShareMenuContentBody';

const ShareMenuContentShare: React.FC<{
  setOpenShareWithGroupAndTeam: (open: boolean) => void;
  individual_permissions: BusterShare['individual_permissions'];
  assetType: ShareAssetType;
  assetId: string;
}> = React.memo(({ setOpenShareWithGroupAndTeam, assetType, individual_permissions, assetId }) => {
  const userTeams = useUserConfigContextSelector((state) => state.userTeams);
  const onShareMetric = useBusterMetricsContextSelector((state) => state.onShareMetric);
  const onShareDashboard = useDashboardContextSelector((state) => state.onShareDashboard);
  const onShareCollection = useCollectionsContextSelector((state) => state.onShareCollection);
  const [inputValue, setInputValue] = React.useState<string>('');
  const [isInviting, setIsInviting] = React.useState<boolean>(false);
  const [defaultPermissionLevel, setDefaultPermissionLevel] = React.useState<ShareRole>(
    ShareRole.VIEWER
  );
  const disableSubmit = !inputHasText(inputValue) || !validate(inputValue);
  const hasUserTeams = userTeams.length > 0;

  const onSubmitNewEmail = useMemoizedFn(async () => {
    const isValidEmail = validate(inputValue);
    if (!isValidEmail) {
      alert('Invalid email address');
      return;
    }

    const payload = {
      id: assetId,
      user_permissions: [
        {
          user_email: inputValue,
          role: defaultPermissionLevel
        }
      ]
    };

    setIsInviting(true);
    if (assetType === ShareAssetType.METRIC) {
      await onShareMetric(payload);
    } else if (assetType === ShareAssetType.DASHBOARD) {
      await onShareDashboard(payload);
    } else if (assetType === ShareAssetType.COLLECTION) {
      await onShareCollection(payload);
    }
    setIsInviting(false);
    setInputValue('');
  });

  const onUpdateShareRole = useMemoizedFn(
    async (userId: string, email: string, role: ShareRole | null) => {
      let payload: ShareRequest = { id: assetId };

      if (!role) {
        payload.remove_users = [userId];
      } else {
        payload.user_permissions = [
          {
            user_email: email,
            role
          }
        ];
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

  const onChangeInputValue = useMemoizedFn((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  });

  const onChangeAccessDropdown = useMemoizedFn((level: ShareRole | null) => {
    level && setDefaultPermissionLevel(level);
  });

  const onOpenShareWithGroupAndTeam = useMemoizedFn(() => {
    setOpenShareWithGroupAndTeam(true);
  });

  return (
    <div className="flex flex-col">
      <div className="flex h-full items-center space-x-2 px-3">
        <div className="relative flex w-full items-center">
          <Input
            className="w-full"
            placeholder="Invite others by email..."
            value={inputValue}
            onChange={onChangeInputValue}
            onPressEnter={onSubmitNewEmail}
          />

          {inputValue && (
            <AccessDropdown
              showRemove={false}
              groupShare={false}
              className="absolute right-[10px]"
              shareLevel={defaultPermissionLevel}
              onChangeShareLevel={onChangeAccessDropdown}
            />
          )}
        </div>
        <Button loading={isInviting} onClick={onSubmitNewEmail} disabled={disableSubmit}>
          Invite
        </Button>
      </div>

      <div className="my-1 px-3">
        {individual_permissions?.map((permission) => (
          <IndividualSharePerson
            key={permission.id}
            {...permission}
            onUpdateShareRole={onUpdateShareRole}
          />
        ))}
      </div>

      <Divider />

      {hasUserTeams && (
        <ShareWithGroupAndTeamOption onOpenShareWithGroupAndTeam={onOpenShareWithGroupAndTeam} />
      )}
    </div>
  );
});
ShareMenuContentShare.displayName = 'ShareMenuContentShare';

const ShareWithGroupAndTeamOption: React.FC<{
  onOpenShareWithGroupAndTeam: () => void;
}> = React.memo(({ onOpenShareWithGroupAndTeam }) => {
  const { styles, cx } = useStyles();

  return (
    <div
      onClick={onOpenShareWithGroupAndTeam}
      className={cx(
        'flex cursor-pointer items-center space-x-1.5 px-3 py-2',
        styles.hoverListItem
      )}>
      <Button shape="circle" icon={<AppMaterialIcons icon="groups_2" size={14} />} />
      <div className={cx('flex w-full items-center justify-between space-x-1.5')}>
        <Text>Share with groups & teams</Text>
        <AppMaterialIcons icon="chevron_right" />
      </div>
    </div>
  );
});
ShareWithGroupAndTeamOption.displayName = 'ShareWithGroupAndTeamOption';

const ContentRecord: Record<ShareMenuTopBarOptions, React.FC<any>> = {
  Share: ShareMenuContentShare,
  Publish: ShareMenuContentPublish,
  Embed: ShareMenuContentEmbed,
  ShareWithGroupAndTeam: ShareWithGroupAndTeam
};
