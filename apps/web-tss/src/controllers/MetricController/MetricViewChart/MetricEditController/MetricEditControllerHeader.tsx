import React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Button } from '@/components/ui/buttons';
import { Xmark } from '@/components/ui/icons';
import { AppTooltip } from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography';

export const MetricEditControllerHeader: React.FC = React.memo(() => {
  const closeSecondaryView = () => {
    alert('TODO: Implement');
    //useChatLayoutContextSelector((x) => x.closeSecondaryView)
  };
  const selectedFileViewSecondary = () => {
    alert('TODO: Implement');
  };

  useHotkeys('esc', () => closeSecondaryView(), {
    enabled: !!selectedFileViewSecondary,
  });

  return (
    <div className={'flex h-[38px] min-h-[38px] items-center justify-between border-b px-4 py-2.5'}>
      <Text>Edit chart</Text>
      <AppTooltip title="Close" shortcuts={['esc']}>
        <Button onClick={closeSecondaryView} variant="ghost" prefix={<Xmark />} />
      </AppTooltip>
    </div>
  );
});

MetricEditControllerHeader.displayName = 'MetricEditControllerHeader';
