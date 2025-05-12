import type { BusterChartProps } from '@/api/asset_interfaces';
import { TrendlineOptions } from '../../core/plugins/chartjs-plugin-trendlines';
import { TypeToLabel } from '../useTrendlines/config';
import { formatLabel } from '@/lib/columnFormatter';

export const createTrendlineOnSeries = ({
  trendlines,
  yAxisKey,
  color,
  columnLabelFormats
}: {
  trendlines: BusterChartProps['trendlines'];
  yAxisKey: string;
  color: string;
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
}): TrendlineOptions[] | undefined => {
  if (!trendlines || trendlines.length === 0) return undefined;

  const relevantTrendlines = trendlines.filter(
    ({ columnId, aggregateAllCategories }) => columnId === yAxisKey && !aggregateAllCategories
  );

  return relevantTrendlines.map(
    ({ type, show, trendlineLabel, trendLineColor, showTrendlineLabel, columnId, ...rest }) => {
      return {
        type,
        show,
        colorMax: trendLineColor === 'inherit' ? color : trendLineColor,
        colorMin: trendLineColor === 'inherit' ? color : trendLineColor,
        label: showTrendlineLabel
          ? {
              display: true,
              text: (v) => {
                if (!trendlineLabel) {
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

                  return labelContent;
                }

                return trendlineLabel;
              }
            }
          : undefined
      } satisfies TrendlineOptions;
    }
  );
};
