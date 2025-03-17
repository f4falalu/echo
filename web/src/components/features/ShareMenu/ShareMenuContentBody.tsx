import React from 'react';
import { validate } from 'email-validator';
import { useMemoizedFn } from '@/hooks';
import { BusterShare, ShareRole, ShareAssetType } from '@/api/asset_interfaces';
import { Input } from '@/components/ui/inputs';
import { Button } from '@/components/ui/buttons';
import { Text } from '@/components/ui/typography';
import { AccessDropdown } from './AccessDropdown';
import { IndividualSharePerson } from './IndividualSharePerson';
import { ShareMenuContentEmbed } from './ShareMenuContentEmbed';
import { ShareMenuContentPublish } from './ShareMenuContentPublish';
import { ShareWithGroupAndTeam } from './ShareWithTeamAndGroup';
import { ShareMenuTopBarOptions } from './ShareMenuTopBar';
import { useUserConfigContextSelector } from '@/context/Users';
import { inputHasText } from '@/lib/text';
import { UserGroup, ChevronRight } from '@/components/ui/icons';
import { cn } from '@/lib/classMerge';
import type { ShareRequest } from '@/api/asset_interfaces/shared_interfaces';
import { useUpdateCollection } from '@/api/buster_rest/collections';
import { useSaveMetric } from '@/api/buster_rest/metrics';
import { useUpdateDashboard } from '@/api/buster_rest/dashboards';

export const ShareMenuContentBody: React.FC<{
  selectedOptions: ShareMenuTopBarOptions;
  setOpenShareWithGroupAndTeam: (open: boolean) => void;
  goBack: () => void;
  onCopyLink: () => void;
  shareAssetConfig: BusterShare;
  assetId: string;
  assetType: ShareAssetType;
  isOwner: boolean;
}> = React.memo(
  ({
    onCopyLink,
    shareAssetConfig,
    selectedOptions,
    assetId,
    isOwner,
    assetType,
    goBack,
    setOpenShareWithGroupAndTeam
  }) => {
    const Component = ContentRecord[selectedOptions];

    const selectedClass = selectedOptions === ShareMenuTopBarOptions.Share ? '' : '';
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
          isOwner={isOwner}
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
  isOwner: boolean;
}> = React.memo(
  ({ isOwner, setOpenShareWithGroupAndTeam, assetType, individual_permissions, assetId }) => {
    const userTeams = useUserConfigContextSelector((state) => state.userTeams);
    const { mutateAsync: onShareDashboard } = useUpdateDashboard();
    const { mutateAsync: onShareMetric } = useSaveMetric();
    const { mutateAsync: onShareCollection } = useUpdateCollection();
    const [inputValue, setInputValue] = React.useState<string>('');
    const [isInviting, setIsInviting] = React.useState<boolean>(false);
    const [defaultPermissionLevel, setDefaultPermissionLevel] = React.useState<ShareRole>(
      ShareRole.VIEWER
    );
    const disableSubmit = !inputHasText(inputValue) || !validate(inputValue);
    const hasUserTeams = userTeams?.length > 0;
    const hasIndividualPermissions = !!individual_permissions?.length;

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
        const payload: ShareRequest = { id: assetId };

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
      if (level) setDefaultPermissionLevel(level);
    });

    const onOpenShareWithGroupAndTeam = useMemoizedFn(() => {
      setOpenShareWithGroupAndTeam(true);
    });

    return (
      <div className="flex flex-col space-y-2.5">
        {isOwner && (
          <div className="flex h-full items-center space-x-2">
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
                  className="absolute top-[50%] right-[10px] -translate-y-1/2"
                  shareLevel={defaultPermissionLevel}
                  onChangeShareLevel={onChangeAccessDropdown}
                />
              )}
            </div>
            <Button
              loading={isInviting}
              size={'tall'}
              onClick={onSubmitNewEmail}
              disabled={disableSubmit}>
              Invite
            </Button>
          </div>
        )}

        {hasIndividualPermissions && (
          <div className="flex flex-col space-y-2 overflow-hidden px-3">
            {individual_permissions?.map((permission) => (
              <IndividualSharePerson
                key={permission.id}
                {...permission}
                onUpdateShareRole={onUpdateShareRole}
              />
            ))}
          </div>
        )}

        {/* {hasUserTeams && (
          <>
            {hasIndividualPermissions && <div className="bg-border my-2 h-[0.5px]" />}
            <ShareWithGroupAndTeamOption
              onOpenShareWithGroupAndTeam={onOpenShareWithGroupAndTeam}
            />
          </>
        )} */}
      </div>
    );
  }
);
ShareMenuContentShare.displayName = 'ShareMenuContentShare';

const ShareWithGroupAndTeamOption: React.FC<{
  onOpenShareWithGroupAndTeam: () => void;
}> = React.memo(({ onOpenShareWithGroupAndTeam }) => {
  return (
    <div
      onClick={onOpenShareWithGroupAndTeam}
      className={cn('hover:bg-item-hover flex cursor-pointer items-center space-x-1.5')}>
      <Button prefix={<UserGroup />} />
      <div className={cn('flex w-full items-center justify-between space-x-1.5')}>
        <Text>Share with groups & teams</Text>
        <ChevronRight />
      </div>
    </div>
  );
});
ShareWithGroupAndTeamOption.displayName = 'ShareWithGroupAndTeamOption';

const ContentRecord: Record<
  ShareMenuTopBarOptions,
  React.FC<{
    setOpenShareWithGroupAndTeam: (open: boolean) => void;
    goBack: () => void;
    onCopyLink: () => void;
    individual_permissions: BusterShare['individual_permissions'];
    team_permissions: BusterShare['team_permissions'];
    organization_permissions: BusterShare['organization_permissions'];
    publicly_accessible: boolean;
    publicExpirationDate: string | null | undefined;
    password: string | null | undefined;
    assetId: string;
    assetType: ShareAssetType;
    isOwner: boolean;
  }>
> = {
  Share: ShareMenuContentShare,
  Embed: ShareMenuContentEmbed,
  ShareWithGroupAndTeam: ShareWithGroupAndTeam,
  Publish: ShareMenuContentPublish
};
