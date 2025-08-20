'use client';

import type { ShareAssetType, ShareConfig } from '@buster/server-shared/share';
import React, { type PropsWithChildren, useState } from 'react';
import { Popover } from '@/components/ui/popover/Popover';
import { AppTooltip } from '@/components/ui/tooltip';
import { canShare } from '@/lib/share';
import { ShareMenuContent } from './ShareMenuContent';

export const ShareMenu: React.FC<
  PropsWithChildren<{
    shareAssetConfig: ShareConfig | null;
    assetId: string;
    assetType: ShareAssetType;
  }>
> = ({ children, shareAssetConfig, assetId, assetType }) => {
  const [isOpen, setIsOpen] = useState(false);

  const onOpenChange = (v: boolean) => {
    setIsOpen(v);
  };

  const showShareMenu = canShare(shareAssetConfig?.permission);

  if (!showShareMenu) {
    return null;
  }

  return (
    <Popover
      size={'none'}
      onOpenChange={onOpenChange}
      align={'end'}
      side={'bottom'}
      content={
        shareAssetConfig ? (
          <ShareMenuContent
            shareAssetConfig={shareAssetConfig}
            assetId={assetId}
            assetType={assetType}
          />
        ) : null
      }
    >
      <AppTooltip title={!isOpen ? 'Share item' : ''}>
        <div className="flex">{children}</div>
      </AppTooltip>
    </Popover>
  );
};
ShareMenu.displayName = 'ShareMenu';
