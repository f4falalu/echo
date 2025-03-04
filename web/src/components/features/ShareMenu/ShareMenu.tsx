'use client';

import React, { PropsWithChildren } from 'react';
import { Popover } from '@/components/ui/tooltip/Popover';
import { AppTooltip } from '@/components/ui/tooltip';
import { useMemoizedFn } from 'ahooks';
import { BusterShare, ShareAssetType } from '@/api/asset_interfaces';
import { ShareMenuContent } from './ShareMenuContent';
import { isShareMenuVisible } from './publicHelpers';

export const ShareMenu: React.FC<
  PropsWithChildren<{
    shareAssetConfig: BusterShare | null;
    assetId: string;
    assetType: ShareAssetType;
  }>
> = ({ children, shareAssetConfig, assetId, assetType }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const onOpenChange = useMemoizedFn((v: boolean) => {
    setIsOpen(v);
  });

  const showShareMenu = shareAssetConfig && isShareMenuVisible(shareAssetConfig);

  if (!showShareMenu) {
    return null;
  }

  const permission = shareAssetConfig?.permission;

  return (
    <Popover
      size={'none'}
      onOpenChange={onOpenChange}
      content={
        shareAssetConfig ? (
          <ShareMenuContent
            shareAssetConfig={shareAssetConfig}
            assetId={assetId}
            assetType={assetType}
            permission={permission}
          />
        ) : null
      }>
      <AppTooltip title={!isOpen ? 'Share item' : ''}>
        <div className="flex">{children}</div>
      </AppTooltip>
    </Popover>
  );
};
