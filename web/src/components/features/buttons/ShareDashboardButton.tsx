import React from 'react';
import { ShareButton } from './ShareButton';
import { ShareMenu } from '../ShareMenu';
import { ShareAssetType } from '@/api/asset_interfaces';
import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { getShareAssetConfig } from '../ShareMenu/helpers';
import { getIsEffectiveOwner } from '@/lib/share';

export const ShareDashboardButton = React.memo(({ dashboardId }: { dashboardId: string }) => {
  const { data: dashboardResponse } = useGetDashboard(dashboardId, getShareAssetConfig);
  const isEffectiveOwner = getIsEffectiveOwner(dashboardResponse?.permission);

  if (!isEffectiveOwner) {
    return null;
  }

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
