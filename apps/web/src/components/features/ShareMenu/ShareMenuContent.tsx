import type { ShareAssetType, ShareConfig } from '@buster/server-shared/share';
import { useRouter } from '@tanstack/react-router';
import React, { useState } from 'react';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { getIsEffectiveOwner } from '@/lib/share';
import { ShareMenuContentBody } from './ShareMenuContentBody';
import { ShareMenuContentEmbedFooter } from './ShareMenuContentEmbed';
import { ShareMenuTopBar, ShareMenuTopBarOptions } from './ShareMenuTopBar';

export const ShareMenuContent: React.FC<{
  shareAssetConfig: ShareConfig;
  assetId: string;
  assetType: ShareAssetType;
}> = React.memo(({ assetId, assetType, shareAssetConfig }) => {
  const { openSuccessMessage } = useBusterNotifications();
  const [selectedOptions, setSelectedOptions] = useState<ShareMenuTopBarOptions>(
    ShareMenuTopBarOptions.Share
  );

  const permission = shareAssetConfig?.permission;
  const publicly_accessible = shareAssetConfig?.publicly_accessible;
  const canEditPermissions = getIsEffectiveOwner(permission);
  const { buildLocation } = useRouter();

  const onCopyLink = useMemoizedFn(() => {
    let url = '';
    if (!assetId) {
      return;
    }
    if (assetType === 'metric_file') {
      url = buildLocation({
        to: '/app/metrics/$metricId/chart',
        params: {
          metricId: assetId,
        },
      }).href;
    } else if (assetType === 'dashboard_file') {
      url = buildLocation({
        to: '/app/dashboards/$dashboardId',
        params: {
          dashboardId: assetId,
        },
      }).href;
    } else if (assetType === 'collection') {
      url = buildLocation({
        to: '/app/collections/$collectionId',
        params: {
          collectionId: assetId,
        },
      }).href;
    } else if (assetType === 'report_file') {
      url = buildLocation({
        to: '/app/reports/$reportId',
        params: {
          reportId: assetId,
        },
      }).href;
    } else if (assetType === 'chat') {
      url = buildLocation({
        to: '/app/chats/$chatId',
        params: {
          chatId: assetId,
        },
      }).href;
    } else {
      const _exhaustiveCheck: never = assetType;
    }
    const urlWithDomain = window.location.origin + url;
    navigator.clipboard.writeText(urlWithDomain);
    openSuccessMessage('Link copied to clipboard');
  });

  return (
    <div className="max-w-[340px] min-w-[340px]">
      {canEditPermissions && (
        <ShareMenuContentHeader
          assetType={assetType}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
          onCopyLink={onCopyLink}
          canEditPermissions={canEditPermissions}
        />
      )}

      <ShareMenuContentBody
        shareAssetConfig={shareAssetConfig}
        assetType={assetType}
        assetId={assetId}
        selectedOptions={selectedOptions}
        onCopyLink={onCopyLink}
        canEditPermissions={canEditPermissions}
        className="px-3 py-2.5"
      />

      <ShareMenuContentFooter
        selectedOptions={selectedOptions}
        publicly_accessible={publicly_accessible}
        assetId={assetId}
        assetType={assetType}
      />
    </div>
  );
});
ShareMenuContent.displayName = 'ShareMenuContent';

const ShareMenuContentHeader = React.memo<{
  assetType: ShareAssetType;
  selectedOptions: ShareMenuTopBarOptions;
  setSelectedOptions: (options: ShareMenuTopBarOptions) => void;
  onCopyLink: () => void;
  canEditPermissions: boolean;
}>(({ assetType, selectedOptions, setSelectedOptions, onCopyLink, canEditPermissions }) => {
  return (
    <div className="border-b px-3 py-2">
      <ShareMenuTopBar
        assetType={assetType}
        selectedOptions={selectedOptions}
        onChangeSelectedOption={setSelectedOptions}
        onCopyLink={onCopyLink}
        canEditPermissions={canEditPermissions}
      />
    </div>
  );
});
ShareMenuContentHeader.displayName = 'ShareMenuContentHeader';

const ShareMenuContentFooter = React.memo<{
  selectedOptions: ShareMenuTopBarOptions;
  publicly_accessible: boolean;
  assetId: string;
  assetType: ShareAssetType;
}>(({ selectedOptions, publicly_accessible, assetId, assetType }) => {
  if (selectedOptions === ShareMenuTopBarOptions.Embed && !publicly_accessible) {
    return (
      <div className="border-t">
        <ShareMenuContentEmbedFooter assetId={assetId} assetType={assetType} />
      </div>
    );
  }

  return null;
});

ShareMenuContentFooter.displayName = 'ShareMenuContentFooter';
