'use client';

import React, { PropsWithChildren } from 'react';
import { PopoverProps } from 'antd';
import { AppPopover } from '@/components/tooltip/AppPopover';
import { AppTooltip } from '@/components';
import { useMemoizedFn } from 'ahooks';
import { BusterShare, ShareAssetType, ShareRole } from '@/api/asset_interfaces';
import { ShareMenuContent } from './ShareMenuContent';

export const ShareMenu: React.FC<
  PropsWithChildren<{
    placement?: PopoverProps['placement'];
    shareAssetConfig: BusterShare;
    shareType: ShareAssetType;
    assetId: string;
    assetType: ShareAssetType;
  }>
> = ({ children, shareAssetConfig, shareType, assetId, assetType, placement = 'bottomLeft' }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const isPublic = shareAssetConfig.publicly_accessible;
  const permission = shareAssetConfig.permission;
  const showShareMenu = permission === ShareRole.OWNER;

  const onOpenChange = useMemoizedFn((v: boolean) => {
    setIsOpen(v);
  });

  if (!showShareMenu) {
    return null;
  }

  return (
    <AppPopover
      trigger={'click'}
      destroyTooltipOnHide
      placement={placement}
      onOpenChange={onOpenChange}
      content={
        <ShareMenuContent
          shareAssetConfig={shareAssetConfig}
          assetId={assetId}
          assetType={assetType}
          shareType={shareType}
          permission={permission}
        />
      }>
      <AppTooltip title={!isOpen ? 'Share item' : ''}>{children}</AppTooltip>
    </AppPopover>
  );
};
