import React from 'react';
import { InputSearchDropdown } from '@/components/ui/inputs/InputSearchDropdown';
import type { ShareAssetType, ShareConfig, ShareRole } from '@buster/server-shared/share';
import { AccessDropdown } from './AccessDropdown';
import { Button } from '@/components/ui/buttons';
import { inputHasText } from '@/lib/text';
import { isValidEmail } from '@/lib/email';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';
import { useShareMetric } from '@/api/buster_rest/metrics';
import { useShareDashboard } from '@/api/buster_rest/dashboards';
import { useShareCollection } from '@/api/buster_rest/collections';

interface ShareMenuInviteProps {
  assetType: ShareAssetType;
  assetId: string;
  individualPermissions: ShareConfig['individual_permissions'];
}

export const ShareMenuInvite: React.FC<ShareMenuInviteProps> = ({
  individualPermissions,
  assetType,
  assetId
}) => {
  const { openErrorMessage } = useBusterNotifications();

  const { mutateAsync: onShareMetric, isPending: isInvitingMetric } = useShareMetric();
  const { mutateAsync: onShareDashboard, isPending: isInvitingDashboard } = useShareDashboard();
  const { mutateAsync: onShareCollection, isPending: isInvitingCollection } = useShareCollection();

  const [inputValue, setInputValue] = React.useState<string>('');
  const [defaultPermissionLevel, setDefaultPermissionLevel] = React.useState<ShareRole>('canView');

  const disableSubmit = !inputHasText(inputValue) || !isValidEmail(inputValue);
  const isInviting = isInvitingMetric || isInvitingDashboard || isInvitingCollection;

  const onChangeAccessDropdown = useMemoizedFn((level: ShareRole | null) => {
    if (level) setDefaultPermissionLevel(level);
  });

  const onSubmitNewEmail = useMemoizedFn(async () => {
    const emailIsValid = isValidEmail(inputValue);
    if (!emailIsValid) {
      openErrorMessage('Invalid email address');
      return;
    }

    const isAlreadyShared = individualPermissions?.some(
      (permission) => permission.email === inputValue
    );

    if (isAlreadyShared) {
      openErrorMessage('Email already shared');
      return;
    }

    const payload: Parameters<typeof onShareMetric>[0] = {
      id: assetId,
      params: [
        {
          email: inputValue,
          role: defaultPermissionLevel
        }
      ]
    };

    if (assetType === 'metric') {
      await onShareMetric(payload);
    } else if (assetType === 'dashboard') {
      await onShareDashboard(payload);
    } else if (assetType === 'collection') {
      await onShareCollection(payload);
    }

    setInputValue('');
  });

  return (
    <div className="flex h-full items-center space-x-2">
      <div className="relative flex w-full items-center">
        <InputSearchDropdown
          options={[]}
          onSelect={() => {}}
          onSearch={() => {}}
          onPressEnter={() => {}}
          value={inputValue}
          onChange={setInputValue}
          placeholder="Invite others by email..."
          className="w-full"
        />

        {inputValue && (
          <AccessDropdown
            showRemove={false}
            className="absolute top-[50%] right-[10px] -translate-y-1/2"
            shareLevel={defaultPermissionLevel}
            onChangeShareLevel={onChangeAccessDropdown}
            assetType={assetType}
            disabled={false}
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
  );
};
