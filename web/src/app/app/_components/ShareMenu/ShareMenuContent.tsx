import { BusterShare, ShareRole, ShareAssetType } from '@/api/asset_interfaces';
import { useBusterNotifications } from '@/context/BusterNotifications';
import React from 'react';
import { ShareMenuTopBar, ShareMenuTopBarOptions } from './ShareMenuTopBar';
import { useMemoizedFn } from 'ahooks';
import { BusterRoutes, createBusterRoute } from '@/routes/busterRoutes';
import { Divider } from 'antd';
import { ShareMenuContentBody } from './ShareMenuContentBody';

export const ShareMenuContent: React.FC<{
  shareAssetConfig: BusterShare;
  assetId: string;
  assetType: ShareAssetType;
  shareType: ShareAssetType;
  permission: ShareRole;
}> = React.memo(({ assetId, assetType, shareAssetConfig, shareType, permission }) => {
  const { openSuccessMessage } = useBusterNotifications();
  const isOwner = permission === ShareRole.OWNER;
  const [selectedOptions, setSelectedOptions] = React.useState<ShareMenuTopBarOptions>(
    isOwner ? ShareMenuTopBarOptions.Share : ShareMenuTopBarOptions.Embed
  );
  const previousSelection = React.useRef<ShareMenuTopBarOptions>(selectedOptions);
  const showShareMenuTopBar =
    isOwner && selectedOptions !== ShareMenuTopBarOptions.ShareWithGroupAndTeam;

  const onCopyLink = useMemoizedFn(() => {
    let url = '';
    if (shareType === ShareAssetType.METRIC && assetId) {
      url = createBusterRoute({ route: BusterRoutes.APP_THREAD_ID, threadId: assetId });
    } else if (shareType === ShareAssetType.DASHBOARD && assetId) {
      url = createBusterRoute({
        route: BusterRoutes.APP_DASHBOARD_ID,
        dashboardId: assetId
      });
    } else if (shareType === ShareAssetType.COLLECTION && assetId) {
      url = createBusterRoute({
        route: BusterRoutes.APP_COLLECTIONS_ID,
        collectionId: assetId
      });
    }
    const urlWithDomain = window.location.origin + url;
    navigator.clipboard.writeText(urlWithDomain);
    openSuccessMessage('Link copied to clipboard');
  });

  const onChangeSelectedOption = useMemoizedFn((option: ShareMenuTopBarOptions) => {
    setSelectedOptions(option);
  });

  const setOpenShareWithGroupAndTeam = useMemoizedFn((open: boolean) => {
    previousSelection.current = selectedOptions;
    setSelectedOptions(ShareMenuTopBarOptions.ShareWithGroupAndTeam);
  });

  const goBack = useMemoizedFn(() => {
    setSelectedOptions(previousSelection.current);
  });

  return (
    <div className="min-w-[320px]">
      {showShareMenuTopBar && (
        <>
          <ShareMenuTopBar
            shareType={shareType}
            selectedOptions={selectedOptions}
            onChangeSelectedOption={onChangeSelectedOption}
            onCopyLink={onCopyLink}
            permission={permission}
          />
          <Divider />
        </>
      )}

      <ShareMenuContentBody
        shareAssetConfig={shareAssetConfig}
        shareType={shareType}
        assetId={assetId}
        assetType={assetType}
        selectedOptions={selectedOptions}
        setOpenShareWithGroupAndTeam={setOpenShareWithGroupAndTeam}
        goBack={goBack}
        onCopyLink={onCopyLink}
      />
    </div>
  );
});
ShareMenuContent.displayName = 'ShareMenuContent';
