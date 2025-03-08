import type { FileType } from '@/api/asset_interfaces';
import { AppTooltip } from '@/components/ui/tooltip';
import { ArrowUpRight } from '@/components/ui/icons';
import { Button } from '@/components/ui/buttons';
import React from 'react';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout/ChatLayoutContext';
import { useMemoizedFn } from '@/hooks';

export const ReasoningFileButtons = React.memo(
  ({ fileType, fileId, type }: { fileType: FileType; fileId: string; type: 'file' | 'status' }) => {
    const onSetSelectedFile = useChatLayoutContextSelector((state) => state.onSetSelectedFile);

    const onOpenFile = useMemoizedFn((e: React.MouseEvent<HTMLButtonElement>) => {
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
          <Button onClick={onOpenFile} variant="ghost" prefix={<ArrowUpRight />}></Button>
        </AppTooltip>
      </div>
    );
  }
);

ReasoningFileButtons.displayName = 'ReasoningFileButtons';
