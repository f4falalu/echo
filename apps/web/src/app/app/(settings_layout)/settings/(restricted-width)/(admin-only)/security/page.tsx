import { SettingsPageHeader } from '../../../_components/SettingsPageHeader';

export default function Page() {
  return (
    <div className="flex flex-col space-y-4">
      <div>
        <SettingsPageHeader
          title="Security"
          description="Manage security and general permission settings"
        />
      </div>
    </div>
  );
}
