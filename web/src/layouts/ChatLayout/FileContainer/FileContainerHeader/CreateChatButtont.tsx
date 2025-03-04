import { AppMaterialIcons } from '@/components/ui';
import { Button } from 'antd';
import React from 'react';
import { useChatLayoutContextSelector } from '../../ChatLayoutContext';
import { useHotkeys } from 'react-hotkeys-hook';
import { useMemoizedFn } from 'ahooks';
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
        color="default"
        variant="solid"
        type="primary"
        className="ml-1.5"
        icon={<AppMaterialIcons icon="stars" />}>
        Edit
      </Button>
    </AppTooltip>
  );
});
CreateChatButton.displayName = 'CreateChatButton';
