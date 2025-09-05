import { createFileRoute } from '@tanstack/react-router';
import { SettingsPageHeader } from '@/components/features/settings';
import { DefaultColorThemeCard } from '@/components/features/settings/DefaultColorThemeCard';

export const Route = createFileRoute(
  '/app/_settings/_restricted_layout/_admin_only/settings/workspace'
)({
  head: () => ({
    meta: [
      { title: 'Workspace Settings' },
      { name: 'description', content: 'Configure your workspace settings and preferences' },
      { name: 'og:title', content: 'Workspace Settings' },
      { name: 'og:description', content: 'Configure your workspace settings and preferences' },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <SettingsPageHeader title="Workspace" description="General settings for your workspace" />

      <div className="flex flex-col space-y-6">
        <DefaultColorThemeCard />
      </div>
    </>
  );
}
