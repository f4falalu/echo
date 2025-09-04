import { type OrganizationRole, OrganizationRoleEnum } from '@buster/server-shared/organization';
import { Select, type SelectItem } from '@/components/ui/select';
import { OrganizationUserRoleText } from '@/lib/organization';

const items: SelectItem<OrganizationRole>[] = Object.values(OrganizationRoleEnum).map((role) => ({
  label: OrganizationUserRoleText[role as OrganizationRole].title,
  secondaryLabel: OrganizationUserRoleText[role as OrganizationRole].description,
  value: role as OrganizationRole,
}));

interface AccessRoleSelectProps {
  role?: OrganizationRole;
  onChange: (role: OrganizationRole) => void;
}

export const AccessRoleSelect = ({ role = 'viewer', onChange }: AccessRoleSelectProps) => {
  return (
    <Select
      items={items}
      className="w-36 max-w-64"
      value={role}
      search
      emptyMessage="No roles found"
      onChange={(v) => onChange(v as OrganizationRole)}
    />
  );
};
