import { SettingsPageHeader } from '@/components/features/settings';
import { ApprovedEmailDomains } from '@/components/features/security/ApprovedEmailDomains';
import { WorkspaceRestrictions } from '@/components/features/security/WorkspaceRestrictions';

export default function Page() {
  return (
    <>
      <SettingsPageHeader
        title="Security"
        description="Manage security and general permission settings"
      />

      <div className="flex flex-col space-y-6">
        {/* <InviteLinks /> */}
        <ApprovedEmailDomains />
        <WorkspaceRestrictions />
      </div>
    </>
  );
}
