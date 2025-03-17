import { type BusterShare, ShareAssetType, ShareRole } from '@/api/asset_interfaces';
import React, { useMemo, useState } from 'react';
import { ShareMenuTopBar, ShareMenuTopBarOptions } from './ShareMenuTopBar';
import { ShareMenuContentBody } from './ShareMenuContentBody';
import { useMemoizedFn } from '@/hooks';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { ShareMenuContentEmbedFooter } from './ShareMenuContentEmbed';

export const ShareMenuContent: React.FC<{
  shareAssetConfig: BusterShare;
  assetId: string;
  assetType: ShareAssetType;
}> = React.memo(({ assetId, assetType, shareAssetConfig }) => {
  const { openSuccessMessage } = useBusterNotifications();
  const [selectedOptions, setSelectedOptions] = useState<ShareMenuTopBarOptions>(
    ShareMenuTopBarOptions.Share
  );
  const previousSelection = React.useRef<ShareMenuTopBarOptions>(selectedOptions);

  const permission = shareAssetConfig?.permission;
  const publicly_accessible = shareAssetConfig?.publicly_accessible;
  const isOwner = permission === ShareRole.OWNER;

  const onCopyLink = useMemoizedFn(() => {
    let url = '';
    if (assetType === ShareAssetType.METRIC && assetId) {
      url = createBusterRoute({ route: BusterRoutes.APP_METRIC_ID, metricId: assetId });
    } else if (assetType === ShareAssetType.DASHBOARD && assetId) {
      url = createBusterRoute({
        route: BusterRoutes.APP_DASHBOARD_ID,
        dashboardId: assetId
      });
    } else if (assetType === ShareAssetType.COLLECTION && assetId) {
      url = createBusterRoute({
        route: BusterRoutes.APP_COLLECTIONS_ID,
        collectionId: assetId
      });
    }
    const urlWithDomain = window.location.origin + url;
    navigator.clipboard.writeText(urlWithDomain);
    openSuccessMessage('Link copied to clipboard');
  });

  const setOpenShareWithGroupAndTeam = useMemoizedFn((open: boolean) => {
    previousSelection.current = selectedOptions;
    setSelectedOptions(ShareMenuTopBarOptions.ShareWithGroupAndTeam);
  });

  const goBack = useMemoizedFn(() => {
    setSelectedOptions(previousSelection.current);
  });

  return (
    <div className="max-w-[340px] min-w-[340px]">
      {isOwner && (
        <ShareMenuContentHeader
          assetType={assetType}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
          onCopyLink={onCopyLink}
          isOwner={isOwner}
        />
      )}
      <div className="px-3 py-2.5">
        <ShareMenuContentBody
          shareAssetConfig={shareAssetConfig}
          assetType={assetType}
          assetId={assetId}
          selectedOptions={selectedOptions}
          setOpenShareWithGroupAndTeam={setOpenShareWithGroupAndTeam}
          goBack={goBack}
          onCopyLink={onCopyLink}
          isOwner={isOwner}
        />
      </div>
      <ShareMenuContentFooter
        selectedOptions={selectedOptions}
        publicly_accessible={publicly_accessible!}
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
  isOwner: boolean;
}>(({ assetType, selectedOptions, setSelectedOptions, onCopyLink, isOwner }) => {
  return (
    <div className="border-b px-3 py-2">
      <ShareMenuTopBar
        assetType={assetType}
        selectedOptions={selectedOptions}
        onChangeSelectedOption={setSelectedOptions}
        onCopyLink={onCopyLink}
        isOwner={isOwner}
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
      <div className="border-t p-2">
        <ShareMenuContentEmbedFooter assetId={assetId} assetType={assetType} />
      </div>
    );
  }

  return <></>;
});
