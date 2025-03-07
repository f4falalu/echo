import { Avatar } from '@/components/ui/avatar';
import { AccessDropdown } from './AccessDropdown';

import React from 'react';
import { ShareRole } from '@/api/asset_interfaces';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks';

export const IndividualSharePerson: React.FC<{
  name: string;
  email: string;
  role: ShareRole;
  id: string;

  onUpdateShareRole: (id: string, email: string, role: ShareRole | null) => void;
}> = React.memo(({ name, onUpdateShareRole, email, id, role }) => {
  const isSameEmailName = name === email;

  const onChangeShareLevel = useMemoizedFn((v: ShareRole | null) => {
    onUpdateShareRole(id, email, v);
  });

  return (
    <div className="flex items-center justify-between space-x-2 px-0 py-1">
      <div className="flex h-full items-center space-x-2">
        <div className="flex h-full flex-col items-center justify-center">
          <Avatar className="h-[24px] w-[24px]" name={name || email} />
        </div>
        <div className="flex flex-col space-y-0">
          <Text className="">{name || email}</Text>

          {isSameEmailName ? null : (
            <Text size="sm" variant="secondary">
              {email}
            </Text>
          )}
        </div>
      </div>

      <AccessDropdown shareLevel={role} showRemove={true} onChangeShareLevel={onChangeShareLevel} />
    </div>
  );
});

IndividualSharePerson.displayName = 'IndividualSharePerson';
