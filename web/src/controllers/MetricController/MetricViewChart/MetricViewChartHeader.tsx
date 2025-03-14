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
    <div
      className={cn(
        'flex max-h-13 min-h-13 flex-col justify-center space-y-0.5 overflow-hidden',
        className
      )}>
      {hasTitleOrDescription ? (
        <>
          <EditableTitle level={4} className="mb-0" inputClassName="h-auto!" onChange={onSetTitle}>
            {title}
          </EditableTitle>
          <div className="flex items-center space-x-1 whitespace-nowrap">
            {!!timeFrame && (
              <>
                <Text size={'sm'} variant="secondary" className="leading-1.3">
                  {timeFrame}
                </Text>
                <Text size={'sm'} variant="secondary">
                  •
                </Text>
              </>
            )}

            <Text size={'sm'} variant="secondary" className="leading-1.3" truncate>
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
