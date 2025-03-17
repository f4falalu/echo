'use client';

import React, { PropsWithChildren, useMemo, useState } from 'react';
import { Popover } from '@/components/ui/tooltip/Popover';
import { AppTooltip } from '@/components/ui/tooltip';
import { useMemoizedFn } from '@/hooks';
import { BusterShare, ShareAssetType } from '@/api/asset_interfaces';
import { ShareMenuContent } from './ShareMenuContent';
import { isShareMenuVisible } from './helpers';
import { ShareMenuTopBar, ShareMenuTopBarOptions } from './ShareMenuTopBar';
import { createBusterRoute, BusterRoutes } from '@/routes';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { ShareMenuContentEmbedFooter } from './ShareMenuContentEmbed';

export const ShareMenu: React.FC<
  PropsWithChildren<{
    shareAssetConfig: BusterShare | null;
    assetId: string;
    assetType: ShareAssetType;
  }>
> = React.memo(({ children, shareAssetConfig, assetId, assetType }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<ShareMenuTopBarOptions>(
    ShareMenuTopBarOptions.Share
  );
  const previousSelection = React.useRef<ShareMenuTopBarOptions>(selectedOptions);
  const { openSuccessMessage } = useBusterNotifications();

  const onOpenChange = useMemoizedFn((v: boolean) => {
    setIsOpen(v);
  });

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

  const showShareMenu = shareAssetConfig && isShareMenuVisible(shareAssetConfig);
  const permission = shareAssetConfig?.permission;
  const publicly_accessible = shareAssetConfig?.publicly_accessible;

  const header = useMemo(
    () => (
      <ShareMenuTopBar
        assetType={assetType}
        selectedOptions={selectedOptions}
        onChangeSelectedOption={setSelectedOptions}
        onCopyLink={onCopyLink}
        permission={permission!}
      />
    ),
    [assetType, selectedOptions, setSelectedOptions, onCopyLink, permission]
  );

  const footerContent = useMemo(() => {
    if (selectedOptions === ShareMenuTopBarOptions.Embed && !publicly_accessible) {
      return <ShareMenuContentEmbedFooter assetId={assetId} assetType={assetType} />;
    }

    return undefined;
  }, [assetId, assetType, selectedOptions, publicly_accessible]);

  if (!showShareMenu) {
    return null;
  }

  return (
    <Popover
      size={'sm'}
      onOpenChange={onOpenChange}
      headerContent={header}
      footerContent={footerContent}
      content={
        shareAssetConfig ? (
          <ShareMenuContent
            shareAssetConfig={shareAssetConfig}
            assetId={assetId}
            assetType={assetType}
            onCopyLink={onCopyLink}
            setOpenShareWithGroupAndTeam={setOpenShareWithGroupAndTeam}
            selectedOptions={selectedOptions}
            goBack={goBack}
          />
        ) : null
      }>
      <AppTooltip title={!isOpen ? 'Share item' : ''}>
        <div className="flex">{children}</div>
      </AppTooltip>
    </Popover>
  );
});
ShareMenu.displayName = 'ShareMenu';
