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
  const { mutateAsync, isPending } = useUpdateUser();

  const userIsMe = user.id === myUser.id;

  const onChange = useMemoizedFn(async (value: string) => {
    await mutateAsync({ userId: user.id, role: value as OrganizationUser['role'] });
    refetchUser();
  });

  return (
    <div className="flex flex-col space-y-5">
      <DefaultAccessDescription name={user.name} />

      <DefaultAccessCard
        role={user.role}
        onChange={onChange}
        isLoading={isPending}
        isAdmin={isAdmin}
        userIsMe={userIsMe}
      />
    </div>
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
    isLoading,
    isAdmin,
    userIsMe
  }: {
    role: OrganizationUser['role'];
    onChange: (role: OrganizationUser['role']) => void;
    isLoading: boolean;
    isAdmin: boolean;
    userIsMe: boolean;
  }) => {
    const isDisabled = !isAdmin || userIsMe;

    return (
      <Card>
        <div className="flex items-center justify-between">
          <Text>Default Access</Text>

          <AppTooltip
            title={
              isDisabled
                ? userIsMe
                  ? 'You cannot change your own access'
                  : 'Only admins can change access'
                : undefined
            }>
            <Select items={accessOptions} value={role} onChange={onChange} disabled={isDisabled} />
          </AppTooltip>
        </div>
      </Card>
    );
  }
);

DefaultAccessCard.displayName = 'DefaultAccessCard';
const DefaultAccessDescription = React.memo(({ name }: { name: string }) => {
  return (
    <div className="flex flex-col space-y-1.5">
      <Title as="h4">Default Access</Title>
      <Text variant="secondary">
        {`This becomes the minimum level of access that ${name} will have for all datasets.`}
      </Text>
    </div>
  );
});

DefaultAccessDescription.displayName = 'DefaultAccessDescription';
