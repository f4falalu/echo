import type { BusterChartProps, ChartEncodes } from '@/api/asset_interfaces';
import {
  AggregateMultiple,
  TrendlineOptions,
  TrendlinePluginOptions
} from '../../core/plugins/chartjs-plugin-trendlines';
import { TypeToLabel } from '../useTrendlines/config';
import { formatLabel } from '@/lib/columnFormatter';

export const createTrendlineOnSeries = ({
  trendlines,
  yAxisKey,
  datasetColor,
  columnLabelFormats,
  useAggregateTrendlines
}: {
  trendlines: BusterChartProps['trendlines'];
  yAxisKey: string;
  datasetColor?: string;
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
  useAggregateTrendlines?: boolean;
}): TrendlineOptions[] | undefined => {
  if (!trendlines || trendlines.length === 0) return undefined;

  const relevantTrendlines = trendlines.filter(({ columnId, aggregateAllCategories }) =>
    columnId === yAxisKey && useAggregateTrendlines
      ? aggregateAllCategories
      : !aggregateAllCategories
  );

  if (relevantTrendlines.length === 0) return undefined;

  if (useAggregateTrendlines) console.log('relevantTrendlines', relevantTrendlines);

  return relevantTrendlines
    .map(
      ({
        type,
        show,
        trendlineLabel,
        lineStyle,
        polynomialOrder,
        trendLineColor,
        showTrendlineLabel,
        columnId,
        projection,
        trendlineLabelPositionOffset,
        ...rest
      }) => {
        return {
          type,
          show,
          projection,
          lineStyle,
          polynomialOrder,
          colorMax: trendLineColor === 'inherit' ? datasetColor || '#000000' : trendLineColor,
          colorMin: trendLineColor === 'inherit' ? datasetColor || '#000000' : trendLineColor,
          label: showTrendlineLabel
            ? {
                positionRatio: trendlineLabelPositionOffset,
                display: true,
                text: (v) => {
                  let value: number | null = null;

                  if (type === 'average') {
                    value = v.averageY;
                  } else if (type === 'median') {
                    value = v.medianY;
                  } else if (type === 'max') {
                    value = v.maxY;
                  } else if (type === 'min') {
                    value = v.minY;
                  }

                  const formattedValue = value
                    ? formatLabel(value, columnLabelFormats[columnId])
                    : '';

                  const trendlineLabel = TypeToLabel[type];
                  const labelContent =
                    trendlineLabel && formattedValue
                      ? `${trendlineLabel}: ${formattedValue}`
                      : trendlineLabel;

                  console.log('labelContent', { labelContent, v, value, formattedValue });

                  return labelContent;
                }
              }
            : undefined
        } satisfies TrendlineOptions;
      }
    )
    .filter((trendline) => trendline.show);
};

export const createAggregrateTrendlines = ({
  trendlines,
  columnLabelFormats,
  selectedAxis
}: {
  selectedAxis: ChartEncodes;
  trendlines: BusterChartProps['trendlines'];
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
}): TrendlinePluginOptions | undefined => {
  if (!trendlines || trendlines.length === 0) return undefined;

  const trendlineOptions = trendlines.reduce<AggregateMultiple[]>((acc, trendline) => {
    const result = createTrendlineOnSeries({
      trendlines: [trendline],
      yAxisKey: trendline.columnId,
      columnLabelFormats,
      useAggregateTrendlines: true
    });

    if (result && result[0]) {
      const isYAxis = selectedAxis.y.includes(trendline.columnId);
      acc.push({
        ...result[0],
        yAxisID: isYAxis ? 'y' : 'y2',
        yAxisKey: trendline.columnId
      });
    }

    return acc;
  }, []);

  console.log('trendlineOptions', trendlineOptions);

  return {
    aggregateMultiple: trendlineOptions
  };
};
