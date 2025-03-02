import React from 'react';
import { Text, Title, AppMaterialIcons } from '@/components/ui';
import { Avatar } from '@/components/ui/avatar';
import type { OrganizationUser } from '@/api/asset_interfaces';
import { Button } from 'antd';

export const UserHeader = React.memo(({ user }: { user: OrganizationUser }) => {
  return (
    <div className="flex justify-between">
      <UserInfo user={user} />
      <ThreeDotMenu user={user} />
    </div>
  );
});

UserHeader.displayName = 'UserHeader';

const UserInfo: React.FC<{ user: OrganizationUser }> = ({ user }) => {
  return (
    <div className="flex items-center space-x-4">
      <Avatar className="h-[48px] w-[48px]" name={user.name} />
      <div className="flex flex-col">
        <Title as="h4">{user.name}</Title>
        <Text size="sm" type="secondary">
          {user.email}
        </Text>
      </div>
    </div>
  );
};

const ThreeDotMenu: React.FC<{ user: OrganizationUser }> = ({ user }) => {
  return <Button type="text" icon={<AppMaterialIcons icon={'more_vert'} />} size="small" />;
};
