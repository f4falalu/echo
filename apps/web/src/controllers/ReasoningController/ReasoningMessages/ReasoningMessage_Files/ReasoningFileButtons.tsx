import { Link } from '@tanstack/react-router';
import React, { useMemo } from 'react';
import type { ReasoningFileType } from '@/api/asset_interfaces';
import { Button } from '@/components/ui/buttons';
import { ArrowUpRight } from '@/components/ui/icons';
import { AppTooltip } from '@/components/ui/tooltip';
import { assetParamsToRoute } from '@/lib/assets/assetParamsToRoute';

export const ReasoningFileButtons = React.memo(
  ({
    fileType,
    fileId,
    type,
    chatId,
    versionNumber,
  }: {
    fileType: ReasoningFileType;
    fileId: string;
    type: 'file' | 'status';
    chatId: string;
    versionNumber?: number;
  }) => {
    const linkProps = useMemo(() => {
      if (fileType === 'agent-action') {
        return;
      }

      if (fileType === 'todo') {
        return;
      }

      return assetParamsToRoute({
        assetType: fileType,
        assetId: fileId,
        chatId,
        versionNumber,
      });
    }, [chatId, fileId, fileType]);

    if (type === 'status' || !linkProps) return null;

    return (
      <AppTooltip title="Open file" sideOffset={12}>
        <Link {...linkProps}>
          <Button variant="ghost" prefix={<ArrowUpRight />} />
        </Link>
      </AppTooltip>
    );
  }
);

ReasoningFileButtons.displayName = 'ReasoningFileButtons';
