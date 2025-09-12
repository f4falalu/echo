import { createFileRoute } from '@tanstack/react-router';
import { ApprovedEmailDomains } from '@/components/features/security/ApprovedEmailDomains';
import { WorkspaceRestrictions } from '@/components/features/security/WorkspaceRestrictions';
import { SettingsPageHeader } from '@/components/features/settings';

export const Route = createFileRoute(
  '/app/_settings/_restricted_layout/_admin_only/settings/security'
)({
  head: () => ({
    meta: [
      { title: 'Security Settings' },
      { name: 'description', content: 'Configure security settings and access controls' },
      { name: 'og:title', content: 'Security Settings' },
      { name: 'og:description', content: 'Configure security settings and access controls' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
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
