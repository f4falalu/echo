import { AppSegmented, AppSegmentedProps } from '@/components/ui';
import React, { useMemo } from 'react';
import { CopyLinkButton } from './CopyLinkButton';
import { ShareAssetType } from '@/api/asset_interfaces';
import { ShareRole } from '@/api/asset_interfaces';
import { useMemoizedFn } from 'ahooks';
import { type SegmentedItem } from '@/components/ui/segmented';

export enum ShareMenuTopBarOptions {
  Share = 'Share',
  Publish = 'Publish',
  Embed = 'Embed',
  ShareWithGroupAndTeam = 'ShareWithGroupAndTeam'
}

export const ShareMenuTopBar: React.FC<{
  selectedOptions: ShareMenuTopBarOptions;
  onChangeSelectedOption: (option: ShareMenuTopBarOptions) => void;
  onCopyLink: () => void;
  assetType: ShareAssetType;
  permission: ShareRole;
}> = React.memo(
  ({ assetType, onCopyLink, selectedOptions, onChangeSelectedOption, permission }) => {
    const isOwner = permission === ShareRole.OWNER;

    const options: AppSegmentedProps['options'] = useMemo(() => {
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
          show: assetType !== ShareAssetType.COLLECTION
        }
      ]
        .filter((o) => o.show)
        .map((o) => ({ ...o, show: undefined }));
    }, [assetType, isOwner]);

    const onChange = useMemoizedFn((v: SegmentedItem) => {
      onChangeSelectedOption(v as ShareMenuTopBarOptions);
    });

    return (
      <div className="flex h-[40px] items-center justify-between px-3">
        <AppSegmented options={options} value={selectedOptions} onChange={onChange} />

        <div className="flex items-center space-x-2">
          <CopyLinkButton onCopyLink={onCopyLink} />
        </div>
      </div>
    );
  }
);
ShareMenuTopBar.displayName = 'ShareMenuTopBar';
