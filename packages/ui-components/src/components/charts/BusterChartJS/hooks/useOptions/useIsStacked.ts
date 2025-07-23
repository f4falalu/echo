import type { ChartType } from '@buster/server-shared/metrics';
import { useMemo } from 'react';
import type { BusterChartProps } from '../../../BusterChart.types';

export const useIsStacked = ({
  selectedChartType,
  lineGroupType,
  barGroupType,
}: {
  selectedChartType: ChartType;
  lineGroupType: BusterChartProps['lineGroupType'];
  barGroupType: BusterChartProps['barGroupType'];
}): boolean => {
  return useMemo(() => {
    if (
      selectedChartType === 'line' &&
      (lineGroupType === 'percentage-stack' || lineGroupType === 'stack')
    ) {
      return true;
    }
    if (
      selectedChartType === 'bar' &&
      (barGroupType === 'percentage-stack' || barGroupType === 'stack')
    ) {
      return true;
    }
    return false;
  }, [selectedChartType, lineGroupType, barGroupType]);
};
