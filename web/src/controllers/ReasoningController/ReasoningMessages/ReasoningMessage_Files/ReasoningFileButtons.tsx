import type { FileType } from '@/api/asset_interfaces';
import { AppTooltip } from '@/components/ui/tooltip';
import { ArrowUpRight } from '@/components/ui/icons';
import { Button } from '@/components/ui/buttons';
import React, { useMemo } from 'react';
import Link from 'next/link';
import { createChatAssetRoute } from '@/layouts/ChatLayout/ChatLayoutContext/helpers';

export const ReasoningFileButtons = React.memo(
  ({
    fileType,
    fileId,
    type,
    chatId
  }: {
    fileType: FileType;
    fileId: string;
    type: 'file' | 'status';
    chatId: string;
  }) => {
    const href = useMemo(() => {
      return createChatAssetRoute({
        chatId: chatId,
        assetId: fileId,
        type: fileType
      });
    }, [chatId, fileId, fileType]);

    if (type === 'status') return null;

    return (
      <AppTooltip title="Open file" sideOffset={12}>
        <Link
          href={href || ''}
          prefetch
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}>
          <Button variant="ghost" prefix={<ArrowUpRight />} />
        </Link>
      </AppTooltip>
    );
  }
);

ReasoningFileButtons.displayName = 'ReasoningFileButtons';
