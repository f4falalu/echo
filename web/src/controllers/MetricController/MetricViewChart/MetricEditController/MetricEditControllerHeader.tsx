import React from 'react';
import { Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/buttons';
import { Xmark } from '@/components/ui/icons';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout';
import { cn } from '@/lib/classMerge';
import { AppTooltip } from '@/components/ui/tooltip';
import { useHotkeys } from 'react-hotkeys-hook';

export const MetricEditControllerHeader: React.FC = React.memo(() => {
  const closeSecondaryView = useChatLayoutContextSelector((x) => x.closeSecondaryView);
  const selectedFileViewSecondary = useChatLayoutContextSelector(
    (x) => x.selectedFileViewSecondary
  );

  useHotkeys('esc', () => closeSecondaryView(), {
    enabled: !!selectedFileViewSecondary
  });

  return (
    <div
      className={cn(
        'h-[38px] min-h-[38px] border-b',
        'flex items-center justify-between',
        'px-4 py-2.5'
      )}>
      <Text>Edit chart</Text>
      <AppTooltip title="Close" shortcuts={['esc']}>
        <Button onClick={closeSecondaryView} variant="ghost" prefix={<Xmark />} />
      </AppTooltip>
    </div>
  );
});

MetricEditControllerHeader.displayName = 'MetricEditControllerHeader';
