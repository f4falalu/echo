import React from 'react';
import { Text } from '@/components/ui/typography';
import { EditableTitle } from '@/components/ui/typography/EditableTitle';
import { cn } from '@/lib/classMerge';

export const MetricViewChartHeader: React.FC<{
  className?: string;
  title: string | undefined;
  description: string | undefined | null;
  timeFrame: string | undefined;
  onSetTitle: (value: string) => void;
}> = React.memo(({ className, title = '', description, timeFrame, onSetTitle }) => {
  const hasTitleOrDescription = !!title || !!description;

  return (
    <div className={cn('flex min-h-[52px] flex-col space-y-0 py-2', className)}>
      {hasTitleOrDescription ? (
        <>
          <EditableTitle level={4} className="mb-0" inputClassName="text-md!" onChange={onSetTitle}>
            {title}
          </EditableTitle>
          <div className="flex items-center space-x-1">
            {!!timeFrame && (
              <>
                <Text size={'sm'} variant="secondary">
                  {timeFrame}
                </Text>
                <Text size={'sm'} variant="secondary">
                  •
                </Text>
              </>
            )}

            <Text size={'sm'} variant="secondary" truncate>
              {description}
            </Text>
          </div>
        </>
      ) : (
        <></>
      )}
    </div>
  );
});

MetricViewChartHeader.displayName = 'MetricViewChartHeader';
