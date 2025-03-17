import { type BusterShare, ShareAssetType } from '@/api/asset_interfaces';
import React from 'react';
import { ShareMenuTopBarOptions } from './ShareMenuTopBar';
import { ShareMenuContentBody } from './ShareMenuContentBody';

export const ShareMenuContent: React.FC<{
  shareAssetConfig: BusterShare;
  assetId: string;
  assetType: ShareAssetType;
  onCopyLink: () => void;
  setOpenShareWithGroupAndTeam: (open: boolean) => void;
  goBack: () => void;
  selectedOptions: ShareMenuTopBarOptions;
}> = React.memo(
  ({
    assetId,
    assetType,
    shareAssetConfig,
    selectedOptions,
    onCopyLink,
    setOpenShareWithGroupAndTeam,
    goBack
  }) => {
    return (
      <div className="min-w-[320px]">
        <ShareMenuContentBody
          shareAssetConfig={shareAssetConfig}
          assetType={assetType}
          assetId={assetId}
          selectedOptions={selectedOptions}
          setOpenShareWithGroupAndTeam={setOpenShareWithGroupAndTeam}
          goBack={goBack}
          onCopyLink={onCopyLink}
        />
      </div>
    );
  }
);
ShareMenuContent.displayName = 'ShareMenuContent';
