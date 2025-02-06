'use client';

import React, { PropsWithChildren } from 'react';
import { PopoverProps } from 'antd';
import { AppPopover } from '@/components/tooltip/AppPopover';
import { AppTooltip } from '@/components/tooltip';
import { useMemoizedFn } from 'ahooks';
import { BusterShare, ShareAssetType } from '@/api/asset_interfaces';
import { ShareMenuContent } from './ShareMenuContent';
import { isShareMenuVisible } from './publicHelpers';

export const ShareMenu: React.FC<
  PropsWithChildren<{
    placement?: PopoverProps['placement'];
    shareAssetConfig: BusterShare | null;
    assetId: string;
    assetType: ShareAssetType;
  }>
> = ({ children, shareAssetConfig, assetId, assetType, placement = 'bottomLeft' }) => {
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
    <AppPopover
      trigger={['click']}
      destroyTooltipOnHide
      placement={placement}
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
      <AppTooltip performant={false} title={!isOpen ? 'Share item' : ''}>
        <div className="flex">{children}</div>
      </AppTooltip>
    </AppPopover>
  );
};
