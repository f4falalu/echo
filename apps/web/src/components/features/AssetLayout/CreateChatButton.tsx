import type { ChatAssetType } from '@buster/server-shared/chats';
import React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Button } from '@/components/ui/buttons';
import { Stars } from '@/components/ui/icons';
import { AppTooltip } from '@/components/ui/tooltip';
import { useStartChatFromAsset } from '@/context/BusterAssets/useStartChatFromAsset';

export const CreateChatButton = React.memo(
  ({ assetId, assetType }: { assetId: string; assetType: ChatAssetType }) => {
    const { onCreateFileClick, loading } = useStartChatFromAsset({
      assetId,
      assetType,
    });

    useHotkeys('e', onCreateFileClick, { preventDefault: true });

    return (
      <AppTooltip title={'Start chat'} shortcuts={['e']} delayDuration={650}>
        <Button
          loading={loading}
          onClick={onCreateFileClick}
          variant="black"
          className="ml-1.5"
          prefix={<Stars />}
        >
          Start chat
        </Button>
      </AppTooltip>
    );
  }
);
CreateChatButton.displayName = 'CreateChatButton';
