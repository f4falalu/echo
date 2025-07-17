import React from 'react';
import { useMemoizedFn } from '@/hooks';
import { AccessDropdown } from './AccessDropdown';
import type { ShareAssetType, ShareRole } from '@buster/server-shared/share';
import { AvatarUserButton } from '../../ui/avatar/AvatarUserButton';

export const IndividualSharePerson: React.FC<{
  name?: string;
  email: string;
  role: ShareRole;
  avatar_url?: string | null;
  onUpdateShareRole: (email: string, role: ShareRole | null) => void;
  assetType: ShareAssetType;
  disabled: boolean;
}> = React.memo(({ name, onUpdateShareRole, email, avatar_url, role, assetType, disabled }) => {
  const onChangeShareLevel = useMemoizedFn((v: ShareRole | null) => {
    onUpdateShareRole(email, v);
  });

  return (
    <div
      className="flex h-8 items-center justify-between space-x-2 overflow-hidden"
      data-testid={`share-person-${email}`}>
      <AvatarUserButton username={name} email={email} avatarUrl={avatar_url} avatarSize={24} />

      <AccessDropdown
        shareLevel={role}
        showRemove={true}
        disabled={disabled}
        onChangeShareLevel={onChangeShareLevel}
        assetType={assetType}
      />
    </div>
  );
});

IndividualSharePerson.displayName = 'IndividualSharePerson';
