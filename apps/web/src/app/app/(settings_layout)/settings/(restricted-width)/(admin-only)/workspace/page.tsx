import { SettingsPageHeader } from '@/components/features/settings';
import { DefaultColorThemeCard } from '@/components/features/settings/DefaultColorThemeCard';

export default function Page() {
  return (
    <>
      <SettingsPageHeader title="Workspace" description="General settings for your workspace" />

      <div className="flex flex-col space-y-6">
        <DefaultColorThemeCard />
      </div>
    </>
  );
}
