import {
  type UserOrganizationRole,
  UserOrganizationRoleSchema,
} from '@buster/server-shared/organization';
import { Select, type SelectItem } from '@/components/ui/select';
import { OrganizationUserRoleText } from '@/lib/organization';

const items: SelectItem<UserOrganizationRole>[] = Object.values(
  UserOrganizationRoleSchema.options
).map((role) => ({
  label: OrganizationUserRoleText[role].title,
  secondaryLabel: OrganizationUserRoleText[role].description,
  value: role satisfies UserOrganizationRole,
}));

interface AccessRoleSelectProps {
  role?: UserOrganizationRole;
  onChange: (role: UserOrganizationRole) => void;
}

export const AccessRoleSelect = ({ role = 'viewer', onChange }: AccessRoleSelectProps) => {
  return (
    <Select<UserOrganizationRole>
      items={items}
      className="w-36 max-w-64"
      value={role}
      search
      emptyMessage="No roles found"
      onChange={(v) => onChange(v)}
    />
  );
};
