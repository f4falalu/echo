import { AppSegmented } from '@/components/ui/segmented';
import React, { useMemo } from 'react';
import { CopyLinkButton } from './CopyLinkButton';
import { ShareAssetType } from '@/api/asset_interfaces';
import { useMemoizedFn } from '@/hooks';
import { type SegmentedItem } from '@/components/ui/segmented';

export enum ShareMenuTopBarOptions {
  Share = 'Share',
  Publish = 'Publish',
  Embed = 'Embed'
}

export const ShareMenuTopBar: React.FC<{
  selectedOptions: ShareMenuTopBarOptions;
  onChangeSelectedOption: (option: ShareMenuTopBarOptions) => void;
  onCopyLink: () => void;
  assetType: ShareAssetType;
  isOwner: boolean;
}> = React.memo(({ assetType, onCopyLink, selectedOptions, onChangeSelectedOption, isOwner }) => {
  const options: SegmentedItem<ShareMenuTopBarOptions>[] = useMemo(() => {
    return [
      {
        value: ShareMenuTopBarOptions.Share,
        label: 'Share',
        show: isOwner
      },
      {
        value: ShareMenuTopBarOptions.Publish,
        label: 'Publish',
        show: assetType !== ShareAssetType.COLLECTION && isOwner
      },
      {
        value: ShareMenuTopBarOptions.Embed,
        label: 'Embed',
        show: assetType === ShareAssetType.METRIC && isOwner
      }
    ]
      .filter((o) => o.show)
      .map((o) => ({ ...o, show: undefined }));
  }, [assetType, isOwner]);

  const onChange = useMemoizedFn((v: SegmentedItem<ShareMenuTopBarOptions>) => {
    onChangeSelectedOption(v.value);
  });

  return (
    <div className="flex items-center justify-between">
      <AppSegmented type="button" options={options} value={selectedOptions} onChange={onChange} />

      <div className="flex items-center space-x-2">
        <CopyLinkButton onCopyLink={onCopyLink} />
      </div>
    </div>
  );
});
ShareMenuTopBar.displayName = 'ShareMenuTopBar';
