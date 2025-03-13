import React from 'react';
import { ShareButton } from './ShareButton';
import { ShareMenu } from '../ShareMenu';
import { ShareAssetType } from '@/api/asset_interfaces';
import { useGetDashboard } from '@/api/buster_rest/dashboards';

export const ShareDashboardButton = React.memo(({ dashboardId }: { dashboardId: string }) => {
  const { data: dashboardResponse } = useGetDashboard(dashboardId);

  return (
    <ShareMenu
      shareAssetConfig={dashboardResponse || null}
      assetId={dashboardId}
      assetType={ShareAssetType.DASHBOARD}>
      <ShareButton />
    </ShareMenu>
  );
});

ShareDashboardButton.displayName = 'ShareDashboardButton';
