import type { FileType } from '@/api/asset_interfaces';
import { createChatAssetRoute } from '@layouts/ChatLayout/ChatLayoutContext/helpers';
import { AppTooltip } from '@/components/tooltip';
import { AppMaterialIcons } from '@/components/icons';
import { Button } from 'antd';
import React from 'react';
import { useChatLayoutContextSelector } from '@chatLayout/ChatLayoutContext';
import { useMemoizedFn } from 'ahooks';

export const ReasoningFileButtons = React.memo(
  ({
    fileType,
    fileId,
    chatId,
    isCompletedStream
  }: {
    fileType: FileType;
    fileId: string;
    chatId: string;
    isCompletedStream: boolean;
  }) => {
    const onSetSelectedFile = useChatLayoutContextSelector((state) => state.onSetSelectedFile);

    const link = createChatAssetRoute({
      chatId: chatId,
      assetId: fileId,
      type: fileType
    });

    const onOpenFile = useMemoizedFn((e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      e.stopPropagation();
      onSetSelectedFile({
        id: fileId,
        type: fileType
      });
    });

    if (!isCompletedStream) return null;

    return (
      <div>
        <AppTooltip title="Open file">
          <Button
            href={link}
            onClick={onOpenFile}
            type="text"
            icon={<AppMaterialIcons icon="open_in_new" />}></Button>
        </AppTooltip>
      </div>
    );
  }
);

ReasoningFileButtons.displayName = 'ReasoningFileButtons';
