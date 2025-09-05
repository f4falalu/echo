import type { ChartEncodes } from '@buster/server-shared/metrics';
import type { BusterChartProps } from '../BusterChart.types';
import type { useDatasetOptions } from '../chartHooks';

export interface BusterChartTypeComponentProps
  extends Omit<
    Required<BusterChartComponentProps>,
    | 'data'
    | 'loading'
    | 'showLegend'
    | 'showLegendHeadline'
    | 'barSortBy'
    | 'onChartMounted'
    | 'animateLegend'
  > {
  onChartReady: () => void;
}

export interface BusterChartComponentProps
  extends Omit<
      Required<BusterChartRenderComponentProps>,
      'selectedAxis' | 'barSortBy' | 'pieSortBy' | 'data'
    >,
    ReturnType<typeof useDatasetOptions> {
  selectedAxis: ChartEncodes;
  isDownsampled: boolean;
}

export interface BusterChartRenderComponentProps
  extends Omit<
    Required<BusterChartProps>,
    | 'metricColumnId'
    | 'metricHeader'
    | 'tableColumnOrder'
    | 'tableColumnWidths'
    | 'tableHeaderBackgroundColor'
    | 'tableHeaderFontColor'
    | 'tableColumnFontColor'
    | 'metricSubHeader'
    | 'metricValueAggregate'
    | 'metricValueLabel'
    | 'id'
    | 'bordered'
    | 'groupByMethod'
    | 'error'
    | 'pieChartAxis'
    | 'comboChartAxis'
    | 'scatterAxis'
    | 'barAndLineAxis'
  > {
  selectedAxis: ChartEncodes;
  data: NonNullable<BusterChartProps['data']>;
}
