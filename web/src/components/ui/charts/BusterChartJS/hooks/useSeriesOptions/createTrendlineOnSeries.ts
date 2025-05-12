import type { BusterChartProps } from '@/api/asset_interfaces';
import { TrendlineOptions } from '../../core/plugins/chartjs-plugin-trendlines';
import { TypeToLabel } from '../useTrendlines/config';
import { formatLabel } from '@/lib/columnFormatter';

export const createTrendlineOnSeries = ({
  trendlines,
  yAxisKey,
  columnLabelFormats
}: {
  trendlines: BusterChartProps['trendlines'];
  yAxisKey: string;
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
}): TrendlineOptions[] | undefined => {
  if (!trendlines || trendlines.length === 0) return undefined;

  const relevantTrendlines = trendlines.filter(({ columnId }) => columnId === yAxisKey);

  return relevantTrendlines.map(
    ({ type, show, trendlineLabel, trendLineColor, showTrendlineLabel, columnId, ...rest }) => {
      return {
        type,
        show,
        colorMax: trendLineColor,
        colorMin: trendLineColor,

        label: showTrendlineLabel
          ? {
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

                  console.log(v);
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
              }, //
              display: true
            }
          : undefined
      } satisfies TrendlineOptions;
    }
  );
};
