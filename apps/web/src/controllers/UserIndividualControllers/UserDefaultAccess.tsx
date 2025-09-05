import type { OrganizationUser } from '@buster/server-shared/organization';
import type { User } from '@buster/server-shared/user';
import React from 'react';
import { useUpdateUser } from '@/api/buster_rest/users';
import { AccessRoleSelect } from '@/components/features/security/AccessRoleSelect';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card/CardBase';
import { AppTooltip } from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';

export const UserDefaultAccess: React.FC<{
  user: OrganizationUser;
  isAdmin: boolean;
  myUser: User;
  refetchUser: () => void;
}> = ({ user, isAdmin, myUser, refetchUser }) => {
  const { mutateAsync } = useUpdateUser();

  const userIsMe = user.id === myUser.id;

  const onChange = useMemoizedFn(async (value: string) => {
    await mutateAsync({ userId: user.id, role: value as OrganizationUser['role'] });
    refetchUser();
  });

  return (
    <DefaultAccessCard
      role={user.role}
      onChange={onChange}
      isAdmin={isAdmin}
      userIsMe={userIsMe}
      name={user.name}
    />
  );
};

const DefaultAccessCard = React.memo(
  ({
    role,
    onChange,
    isAdmin,
    userIsMe,
    name,
  }: {
    role: OrganizationUser['role'];
    onChange: (role: OrganizationUser['role']) => void;
    isAdmin: boolean;
    userIsMe: boolean;
    name: string;
  }) => {
    const isDisabled = !isAdmin || userIsMe;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Default Access</CardTitle>
          <CardDescription>
            This becomes the minimum level of access that {name} will have for all datasets.
          </CardDescription>
        </CardHeader>
        <CardContent className="!pt-0">
          <div className="flex items-center justify-between">
            <Text variant="secondary">Access level</Text>
            <div className="min-w-44">
              <AppTooltip
                title={
                  isDisabled
                    ? userIsMe
                      ? 'You cannot change your own access'
                      : 'Only admins can change access'
                    : undefined
                }
              >
                <AccessRoleSelect role={role} onChange={onChange} />
              </AppTooltip>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

DefaultAccessCard.displayName = 'DefaultAccessCard';
