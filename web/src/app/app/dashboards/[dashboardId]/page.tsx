import React from 'react';
import { DashboardIndividualContent } from './_DashboardIndividualContent';
import { AppAssetCheckLayout } from '../../_layouts/AppAssetCheckLayout';

export default function DashboardPage({
  params: { dashboardId }
}: {
  params: {
    dashboardId: string;
  };
}) {
  return (
    <AppAssetCheckLayout dashboardId={dashboardId} type="dashboard">
      <DashboardIndividualContent />
    </AppAssetCheckLayout>
  );
}
