import React from 'react';
import { Popover, type PopoverProps } from '../../ui/popover';
import { InputCard } from '../../ui/card/InputCard';
import type { ShareAssetType } from '@buster/server-shared/share';
import { useMemoizedFn } from '../../../hooks';
import { useStartChatFromAsset } from '../../../api/buster_rest/chats';

type FollowUpWithAssetProps = {
  assetType: Exclude<ShareAssetType, 'chat' | 'collection'>;
  assetId: string;
  children: React.ReactNode;
  side?: PopoverProps['side'];
  align?: PopoverProps['align'];
  placeholder?: string;
  buttonText?: string;
};

export const FollowUpWithAssetPopup: React.FC<FollowUpWithAssetProps> = React.memo(
  ({
    assetType,
    assetId,
    side,
    align,
    children,
    placeholder = 'Describe the filter you want to apply',
    buttonText = 'Apply custom filter'
  }) => {
    const { mutateAsync: startChatFromAsset, isPending } = useStartChatFromAsset();
    const onSubmit = useMemoizedFn(async (value: string) => {
      console.log('onSubmit', assetType, assetId);
      await startChatFromAsset({
        asset_id: assetId,
        asset_type: assetType,
        prompt: value
      });
    });

    return (
      <Popover
        side={side}
        align={align}
        className="p-0"
        content={
          <InputCard
            placeholder={placeholder}
            buttonText={buttonText}
            onSubmit={onSubmit}
            loading={isPending}
          />
        }>
        {children}
      </Popover>
    );
  }
);

FollowUpWithAssetPopup.displayName = 'FollowUpWithAssetPopup';
