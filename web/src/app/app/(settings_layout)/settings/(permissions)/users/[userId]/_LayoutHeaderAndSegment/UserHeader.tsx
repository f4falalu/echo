import React from 'react';
import { DotsVertical } from '@/components/ui/icons';
import { Title, Text } from '@/components/ui/typography';
import { Avatar } from '@/components/ui/avatar';
import type { OrganizationUser } from '@/api/asset_interfaces';
import { Button } from '@/components/ui/buttons';

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
        <Text size="sm" variant="secondary">
          {user.email}
        </Text>
      </div>
    </div>
  );
};

const ThreeDotMenu: React.FC<{ user: OrganizationUser }> = ({ user }) => {
  return <Button variant="ghost" prefix={<DotsVertical />} size="small" />;
};
