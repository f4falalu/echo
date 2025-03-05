import type { FileType } from '@/api/asset_interfaces';
import { AppTooltip } from '@/components/ui/tooltip';
import { AppMaterialIcons } from '@/components/ui';
import { Button } from 'antd';
import React from 'react';
import { useChatLayoutContextSelector } from '@chatLayout/ChatLayoutContext';
import { useMemoizedFn } from 'ahooks';

export const ReasoningFileButtons = React.memo(
  ({ fileType, fileId, type }: { fileType: FileType; fileId: string; type: 'file' | 'status' }) => {
    const onSetSelectedFile = useChatLayoutContextSelector((state) => state.onSetSelectedFile);

    const onOpenFile = useMemoizedFn((e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      e.stopPropagation();
      onSetSelectedFile({
        id: fileId,
        type: fileType
      });
    });

    if (type === 'status') return null;

    return (
      <div>
        <AppTooltip title="Open file" sideOffset={12}>
          <Button
            onClick={onOpenFile}
            type="text"
            icon={<AppMaterialIcons icon="open_in_new" />}></Button>
        </AppTooltip>
      </div>
    );
  }
);

ReasoningFileButtons.displayName = 'ReasoningFileButtons';
