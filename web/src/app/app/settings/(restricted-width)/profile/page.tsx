import React from 'react';
import { SettingsPageHeader } from '../../_components/SettingsPageHeader';
import { SettingsEmptyState } from '../../_components/SettingsEmptyState';

export default function LogsPage() {
  return (
    <div>
      <SettingsPageHeader title="Profile" description="Manage your profile & information" />
      <SettingsEmptyState />
    </div>
  );
}
