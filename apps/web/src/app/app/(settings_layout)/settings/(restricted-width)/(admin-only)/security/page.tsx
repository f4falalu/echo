import { InviteLinks } from '@/components/features/security/InviteLinks';
import { SettingsPageHeader } from '../../../_components/SettingsPageHeader';
import { ApprovedEmailDomains } from '@/components/features/security/ApprovedEmailDomains';
import { WorkspaceRestrictions } from '@/components/features/security/WorkspaceRestrictions';

export default function Page() {
  return (
    <div className="flex flex-col space-y-4">
      <div>
        <SettingsPageHeader
          title="Security"
          description="Manage security and general permission settings"
        />

        <div className="flex flex-col space-y-6">
          <InviteLinks />
          <ApprovedEmailDomains />
          <WorkspaceRestrictions />
        </div>
      </div>
    </div>
  );
}
