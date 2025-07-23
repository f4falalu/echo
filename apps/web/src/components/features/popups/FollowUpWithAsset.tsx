import React from 'react';
import { Popover, type PopoverProps } from '../../ui/popover';
import { InputCard } from '../../ui/card/InputCard';
import type { ShareAssetType } from '@buster/server-shared/share';
import { useMemoizedFn } from '../../../hooks';
import { useStartChatFromAsset } from '../../../api/buster_rest/chats';
import { AppTooltip } from '../../ui/tooltip';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { assetParamsToRoute } from '../../../lib/assets';

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
    side = 'bottom',
    align = 'end',
    children,
    placeholder = 'Describe the filter you want to apply',
    buttonText = 'Apply custom filter'
  }) => {
    const { mutateAsync: startChatFromAsset, isPending } = useStartChatFromAsset();
    const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);

    const onSubmit = useMemoizedFn(async (prompt: string) => {
      if (!prompt || !assetId || !assetType || isPending) return;
      const res = await startChatFromAsset({
        asset_id: assetId,
        asset_type: assetType,
        prompt
      });
      const link = assetParamsToRoute({
        assetId,
        type: assetType,
        chatId: res.id
      });

      console.log(link);

      onChangePage(link);
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
            className="border-none"
          />
        }>
        <AppTooltip title="Apply custom filter">{children}</AppTooltip>
      </Popover>
    );
  }
);

FollowUpWithAssetPopup.displayName = 'FollowUpWithAssetPopup';
