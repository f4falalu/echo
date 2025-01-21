import { TeamRole } from '@/api';
import { Select } from 'antd';
import React from 'react';

const options: { label: string; value: TeamRole }[] = [
  {
    label: 'Manager',
    value: TeamRole.MANAGER
  },
  {
    label: 'Member',
    value: TeamRole.MEMBER
  },
  {
    label: 'Not a Member',
    value: TeamRole.NONE
  }
];

export const PermissionAssignTeamRole: React.FC<{
  role: TeamRole;
  id: string;
  onRoleChange: (data: { id: string; role: TeamRole }) => void;
}> = React.memo(({ role, id, onRoleChange }) => {
  return (
    <Select
      options={options}
      value={role}
      onChange={(v) => {
        onRoleChange({ id, role: v });
      }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    />
  );
});

PermissionAssignTeamRole.displayName = 'PermissionAssignTeamRole';
