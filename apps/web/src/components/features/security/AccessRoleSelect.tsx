import React from 'react';
import { Select, type SelectItem } from '@/components/ui/select';
import { OrganizationRoleEnum, type OrganizationRole } from '@buster/server-shared/organization';
import { OrganizationUserRoleText } from '@/lib/organization';

const items: SelectItem<OrganizationRole>[] = Object.values(OrganizationRoleEnum).map((role) => ({
  label: OrganizationUserRoleText[role as OrganizationRole].title,
  secondaryLabel: OrganizationUserRoleText[role as OrganizationRole].description,
  value: role as OrganizationRole
}));

interface AccessRoleSelectProps {
  role?: OrganizationRole;
  onChange: (role: OrganizationRole) => void;
}

export const AccessRoleSelect = ({ role = 'viewer', onChange }: AccessRoleSelectProps) => {
  return (
    <Select
      items={items}
      className="w-36 max-w-72"
      value={role}
      onChange={(v) => onChange(v as OrganizationRole)}
    />
  );
};
