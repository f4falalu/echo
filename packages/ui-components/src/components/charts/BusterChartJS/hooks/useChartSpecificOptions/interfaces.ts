import type { ChartType as ChartJSChartType } from 'chart.js';
import type { BusterChartProps } from '../../../BusterChart.types';
import type { ChartEncodes, ChartType } from '@buster/server-shared/metrics';
import type { ChartProps } from '../../core';

export interface UseChartSpecificOptionsProps {
  selectedChartType: ChartType;
  pieShowInnerLabel: BusterChartProps['pieShowInnerLabel'];
  pieInnerLabelTitle: BusterChartProps['pieInnerLabelTitle'];
  pieInnerLabelAggregate: BusterChartProps['pieInnerLabelAggregate'];
  pieDonutWidth: BusterChartProps['pieDonutWidth'];
  pieLabelPosition: BusterChartProps['pieLabelPosition'];
  pieDisplayLabelAs: BusterChartProps['pieDisplayLabelAs'];
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
  selectedAxis: ChartEncodes;
  barShowTotalAtTop: BusterChartProps['barShowTotalAtTop'];
  columnSettings: BusterChartProps['columnSettings'];
  barGroupType: BusterChartProps['barGroupType'];
  data: ChartProps<ChartJSChartType>['data'];
}

export type ChartSpecificOptionsProps = Omit<UseChartSpecificOptionsProps, 'selectedChartType'>;
