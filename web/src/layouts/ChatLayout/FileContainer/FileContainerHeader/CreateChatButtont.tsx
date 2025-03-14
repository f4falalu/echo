import { Stars } from '@/components/ui/icons';
import { Button } from '@/components/ui/buttons';
import React from 'react';
import { useChatLayoutContextSelector } from '../../ChatLayoutContext';
import { useHotkeys } from 'react-hotkeys-hook';
import { useMemoizedFn } from '@/hooks';
import { AppTooltip } from '@/components/ui/tooltip';

export const CreateChatButton = React.memo(() => {
  const onCollapseFileClick = useChatLayoutContextSelector((x) => x.onCollapseFileClick);

  const onCollapseFileClickPreflight = useMemoizedFn(() => {
    onCollapseFileClick(false);
  });

  useHotkeys('e', onCollapseFileClickPreflight, { preventDefault: true });

  return (
    <AppTooltip title={'Start chat'} shortcuts={['e']}>
      <Button
        onClick={onCollapseFileClickPreflight}
        variant="black"
        className="ml-1.5"
        prefix={<Stars />}>
        Start chat
      </Button>
    </AppTooltip>
  );
});
CreateChatButton.displayName = 'CreateChatButton';
