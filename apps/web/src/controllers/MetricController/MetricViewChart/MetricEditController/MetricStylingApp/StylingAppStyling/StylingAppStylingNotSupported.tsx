import React, { useMemo } from 'react';
import type { ChartConfigProps } from '@buster/server-shared/metrics';
import type { ChartType } from '@buster/server-shared/metrics';
import { Text } from '@/components/ui/typography';

export const StylingAppStylingNotSupported = React.memo(
  ({ selectedChartType }: { selectedChartType: ChartConfigProps['selectedChartType'] }) => {
    const title = useMemo(() => {
      if (selectedChartType === 'table') {
        return 'Styling for tables charts is coming soon';
      }
      if (selectedChartType === 'metric') {
        return 'Styling for metric charts is coming soon';
      }
      return '';
    }, [selectedChartType]);

    return (
      <div className="flex h-full w-full items-center justify-center p-5">
        <Text variant="secondary" className="text-center">
          {title}
        </Text>
      </div>
    );
  }
);
StylingAppStylingNotSupported.displayName = 'StylingAppStylingNotSupported';
