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
            'justify-between group flex h-full min-h-0 w-full flex-1 flex-nowrap space-x-0.5',
            useHeaderLink && 'hover:bg-item-hover relative'
          )}
        >
          <div
            {...attributes}
            {...listeners}
            className={cn(
              'flex max-h-13 min-h-13 flex-col justify-center space-y-0.5 overflow-hidden w-full pl-4 pr-1.5'
            )}
            data-testid={`metric-item-${metricId}`}
          >
            {hasTitleOrDescription ? (
              <>
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
          {headerSecondaryContent && (
            <MetricCardThreeMenuContainer>{headerSecondaryContent}</MetricCardThreeMenuContainer>
          )}
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
      to="/app/dashboards/$dashboardId/metrics/$metricId/chart"
      params={(prev) => ({
        ...(prev as { dashboardId: string }),
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

export const MetricCardThreeMenuContainer = ({
  children,
  className,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      className={cn(
        // Use opacity and pointer-events instead of display:none to maintain positioning context
        'mt-1.5 mr-1.5  hidden group-hover:block',
        'group-hover:pointer-events-auto',
        //     isOpen && 'pointer-events-auto block',
        className
      )}
    >
      {children}
    </div>
  );
};
