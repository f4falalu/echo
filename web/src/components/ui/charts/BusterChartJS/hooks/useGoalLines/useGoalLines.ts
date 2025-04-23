import type {
  BusterChartConfigProps,
  ChartType,
  ColumnLabelFormat,
  GoalLine
} from '@/api/asset_interfaces/metric/charts';
import { AnnotationOptions, AnnotationPluginOptions } from 'chartjs-plugin-annotation';
import { useMemo } from 'react';
import { formatLabel } from '@/lib/columnFormatter';
import { extractFieldsFromChain } from '../../../chartHooks';
import { defaultLabelOptionConfig } from '../useChartSpecificOptions/labelOptionConfig';
import { yAxisSimilar } from '../../../commonHelpers';
import { DEFAULT_COLUMN_LABEL_FORMAT } from '@/api/asset_interfaces/metric';

export const useGoalLines = ({
  goalLines,
  selectedChartType,
  columnLabelFormats,
  yAxisKeys,
  y2AxisKeys,
  lineGroupType,
  barGroupType,
  barLayout
}: {
  goalLines: GoalLine[];
  selectedChartType: ChartType;
  columnLabelFormats: NonNullable<BusterChartConfigProps['columnLabelFormats']>;
  yAxisKeys: string[];
  y2AxisKeys: string[] | undefined;
  lineGroupType: BusterChartConfigProps['lineGroupType'];
  barLayout: BusterChartConfigProps['barLayout'];
  barGroupType: BusterChartConfigProps['barGroupType'];
}): AnnotationPluginOptions['annotations'] => {
  const canSupportGoalLines = useMemo(() => {
    if (yAxisKeys.length === 0) {
      return false;
    }
    if (selectedChartType === 'bar') {
      return barGroupType !== 'percentage-stack';
    }
    if (selectedChartType === 'line') {
      return lineGroupType !== 'percentage-stack';
    }
    return false;
  }, [selectedChartType, barGroupType, lineGroupType]);

  const goalLineLabelFormat: ColumnLabelFormat = useMemo(() => {
    const allKeys = [...yAxisKeys, ...(y2AxisKeys || [])];
    const isSimilar = yAxisSimilar(allKeys, columnLabelFormats);
    if (isSimilar) {
      const key = extractFieldsFromChain(yAxisKeys[0]!)[0]?.key!;
      return columnLabelFormats[key] || DEFAULT_COLUMN_LABEL_FORMAT;
    }
    return {
      columnType: 'number',
      style: 'number'
    };
  }, [columnLabelFormats, yAxisKeys, y2AxisKeys]);

  const { minKey, maxKey } = useMemo(() => {
    if (selectedChartType === 'bar' && barLayout === 'horizontal') {
      return { minKey: 'xMin', maxKey: 'xMax' } as const;
    }
    return { minKey: 'yMin', maxKey: 'yMax' } as const;
  }, [selectedChartType, barLayout]);

  const annotations: AnnotationPluginOptions['annotations'] = useMemo(() => {
    if (!canSupportGoalLines) {
      return [];
    }

    return goalLines.reduce<Record<string, AnnotationOptions<'line'>>>((acc, goalLine, index) => {
      const { value, goalLineLabel, goalLineColor, showGoalLineLabel, show } = goalLine;
      if (show) {
        const id = `🔥-goal-line-${index}`;
        const formattedValue = [goalLineLabel, formatLabel(value, goalLineLabelFormat)]
          .filter(Boolean)
          .join(' ');

        const item: AnnotationOptions<'line'> = {
          type: 'line',
          id,
          [minKey]: value,
          [maxKey]: value,
          borderColor: goalLineColor || 'black',
          borderWidth: 1.5,
          borderDash: [5, 5],
          label: {
            content: formattedValue,
            display: showGoalLineLabel,
            //@ts-ignore
            anchor: 'end',
            align: 'top',
            ...defaultLabelOptionConfig
          }
        };
        acc[id] = item;
      }
      return acc;
    }, {});
  }, [goalLines, minKey, maxKey, canSupportGoalLines, goalLineLabelFormat]);

  return annotations;
};
