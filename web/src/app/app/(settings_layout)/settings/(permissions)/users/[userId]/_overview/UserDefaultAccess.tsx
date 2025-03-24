import { type BusterUser, type OrganizationUser } from '@/api/asset_interfaces';
import React from 'react';
import { Title, Text } from '@/components/ui/typography';
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardTitle,
  CardFooter
} from '@/components/ui/card/CardBase';
import { Select, SelectItem } from '@/components/ui/select';
import { useMemoizedFn } from '@/hooks';
import { AppTooltip } from '@/components/ui/tooltip';
import { useUpdateUser } from '@/api/buster_rest';

export const UserDefaultAccess: React.FC<{
  user: OrganizationUser;
  isAdmin: boolean;
  myUser: BusterUser;
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

const accessOptions: SelectItem<OrganizationUser['role']>[] = [
  { label: 'Data Admin', value: 'dataAdmin' },
  { label: 'Workspace Admin', value: 'workspaceAdmin' },
  { label: 'Querier', value: 'querier' },
  { label: 'Restricted Querier', value: 'restrictedQuerier' }
];

const DefaultAccessCard = React.memo(
  ({
    role,
    onChange,
    isAdmin,
    userIsMe,
    name
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
            <AppTooltip
              title={
                isDisabled
                  ? userIsMe
                    ? 'You cannot change your own access'
                    : 'Only admins can change access'
                  : undefined
              }>
              <Select
                items={accessOptions}
                value={role}
                onChange={onChange}
                disabled={isDisabled}
              />
            </AppTooltip>
          </div>
        </CardContent>
      </Card>
    );
  }
);

DefaultAccessCard.displayName = 'DefaultAccessCard';
