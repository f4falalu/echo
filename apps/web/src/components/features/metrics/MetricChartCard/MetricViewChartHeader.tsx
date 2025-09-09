import { Link } from '@tanstack/react-router';
import React from 'react';
import { Text } from '@/components/ui/typography';
import { EditableTitle } from '@/components/ui/typography/EditableTitle';
import { cn } from '@/lib/classMerge';
import type { MetricChartCardProps } from './MetricChartCard';

export const METRIC_CHART_TITLE_INPUT_ID = 'metric-chart-title-input';

type MetricViewChartHeaderProps = {
  name: string | undefined;
  description: string | undefined | null;
  timeFrame: string | undefined;
  onSetTitle: (value: string) => void;
  metricId: string;
  metricVersionNumber: number | undefined;
} & Pick<
  MetricChartCardProps,
  'attributes' | 'listeners' | 'headerSecondaryContent' | 'useHeaderLink' | 'readOnly'
>;

export const MetricViewChartHeader: React.FC<MetricViewChartHeaderProps> = React.memo(
  ({
    name = '',
    description,
    timeFrame,
    onSetTitle,
    readOnly,
    attributes,
    listeners,
    headerSecondaryContent,
    useHeaderLink = false,
    metricId,
    metricVersionNumber,
  }) => {
    const hasTitleOrDescription = !!name || !!description;

    return (
      <LinkWrapper
        useHeaderLink={useHeaderLink}
        metricId={metricId}
        metricVersionNumber={metricVersionNumber}
      >
        <div
          className={cn(
            'justify-between group flex h-full w-full flex-1 flex-nowrap space-x-0 max-h-13 min-h-13',
            useHeaderLink && 'hover:bg-item-hover relative'
          )}
        >
          <div
            {...attributes}
            {...listeners}
            className={cn(
              'flex  flex-col justify-center space-y-0.5 overflow-hidden w-full pl-4 pr-1.5',
              !headerSecondaryContent && 'mr-2'
            )}
            data-testid={`metric-item-${metricId}`}
          >
            {hasTitleOrDescription ? (
              <>
                <TitleWrapper
                  name={name}
                  readOnly={readOnly}
                  onSetTitle={onSetTitle}
                  useHeaderLink={useHeaderLink}
                />
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
            ) : null}
          </div>
          {headerSecondaryContent}
        </div>
      </LinkWrapper>
    );
  }
);

MetricViewChartHeader.displayName = 'MetricViewChartHeader';

const LinkWrapper: React.FC<{
  useHeaderLink: boolean;
  children: React.ReactNode;
  metricId: string;
  metricVersionNumber: number | undefined;
}> = ({ useHeaderLink, children, metricId, metricVersionNumber }) => {
  if (!useHeaderLink) return <>{children}</>;

  return (
    <Link
      unsafeRelative="path"
      to={'./metrics/$metricId/chart' as '/app/metrics/$metricId/chart'}
      params={(prev) => ({
        ...prev,
        metricId,
      })}
      search={(prev) => ({
        ...prev,
        metric_version_number: metricVersionNumber,
      })}
    >
      {children}
    </Link>
  );
};

const TitleWrapper: React.FC<{
  name: string;
  onSetTitle: (value: string) => void;
  useHeaderLink: boolean;
  readOnly?: boolean;
}> = ({ name, readOnly = false, onSetTitle, useHeaderLink }) => {
  if (readOnly)
    return (
      <Text truncate className="text-[14px]">
        {name}
      </Text>
    );

  return (
    <EditableTitle
      id={METRIC_CHART_TITLE_INPUT_ID}
      level={4}
      readOnly={readOnly}
      inputClassName="h-auto!"
      placeholder="New chart"
      onChange={onSetTitle}
      variant={useHeaderLink ? 'ghost' : 'default'}
    >
      {name}
    </EditableTitle>
  );
};
