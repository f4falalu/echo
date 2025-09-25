/** biome-ignore-all lint/style/noNonNullAssertion: false positive */
import { useMemo } from 'react';
import type { BusterChartProps } from '../../../BusterChart.types';

const MIN_PERCENT_DIFFERENCE = 2;
const MAX_PERCENT_DIFFERENCE = 2;

export const useYTickValues = ({
  hasY2Axis,
  isSupportedType,
  columnMetadata,
  selectedChartType,
  yAxisKeys,
  y2AxisKeys,
  columnLabelFormats,
}: {
  hasY2Axis: boolean;
  isSupportedType: boolean;
  columnMetadata: BusterChartProps['columnMetadata'];
  selectedChartType: BusterChartProps['selectedChartType'];
  yAxisKeys: string[];
  y2AxisKeys: string[];
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
}) => {
  const shouldUseMinAndMaxValues =
    !hasY2Axis || !isSupportedType || !columnMetadata || selectedChartType !== 'combo';

  const checkValues = useMemo(() => {
    return [...yAxisKeys, ...y2AxisKeys];
  }, [yAxisKeys, y2AxisKeys]);

  const allYValuesArePercentage = useMemo(() => {
    return checkValues.every((key) => {
      const columnFormat = columnLabelFormats[key];
      return columnFormat?.style === 'percent';
    });
  }, [checkValues, columnLabelFormats]);

  const columnMap = useMemo(() => {
    if (!columnMetadata) return new Map();
    return new Map(columnMetadata.map((col) => [col.name, col]));
  }, [columnMetadata]);

  const minTickValue: number | undefined = useMemo(() => {
    if (!shouldUseMinAndMaxValues) return undefined;

    // If all Y values are percentages, return the lowest value
    if (allYValuesArePercentage) {
      const lowestValue = checkValues.reduce((min, key) => {
        const column = columnMap.get(key);
        return Math.min(min, Number(column?.min_value ?? 0));
      }, Infinity);
      if (lowestValue === Infinity) return undefined;
      if (lowestValue > 0) return 0;
      return lowestValue;
    }

    // If y and y2 axes min/max values are within 130% of each other, use the same scale

    // Calculate min/max ranges for y-axis columns
    const yAxisRange = yAxisKeys.reduce(
      (acc, key) => {
        const column = columnMap.get(key);
        if (!column) return acc;
        const min = Number(column.min_value ?? 0);
        const max = Number(column.max_value ?? 0);
        return {
          min: Math.min(acc.min, min),
          max: Math.max(acc.max, max),
        };
      },
      { min: Infinity, max: -Infinity }
    );

    // Calculate min/max ranges for y2-axis columns
    const y2AxisRange = y2AxisKeys.reduce(
      (acc, key) => {
        const column = columnMap.get(key);
        if (!column) return acc;
        const min = Number(column.min_value ?? 0);
        const max = Number(column.max_value ?? 0);
        return {
          min: Math.min(acc.min, min),
          max: Math.max(acc.max, max),
        };
      },
      { min: Infinity, max: -Infinity }
    );

    // Reset infinities if no valid data found
    if (yAxisRange.min === Infinity) yAxisRange.min = 0;
    if (yAxisRange.max === -Infinity) yAxisRange.max = 0;
    if (y2AxisRange.min === Infinity) y2AxisRange.min = 0;
    if (y2AxisRange.max === -Infinity) y2AxisRange.max = 0;

    // Check if min values are within 130% of each other
    const minValuesAreSimilar =
      Math.abs(yAxisRange.min) > 0 && Math.abs(y2AxisRange.min) > 0
        ? Math.max(yAxisRange.min, y2AxisRange.min) / Math.min(yAxisRange.min, y2AxisRange.min) <=
          MIN_PERCENT_DIFFERENCE
        : yAxisRange.min === y2AxisRange.min;

    // Check if max values are within 130% of each other
    const maxValuesAreSimilar =
      Math.abs(yAxisRange.max) > 0 && Math.abs(y2AxisRange.max) > 0
        ? Math.max(yAxisRange.max, y2AxisRange.max) / Math.min(yAxisRange.max, y2AxisRange.max) <=
          MIN_PERCENT_DIFFERENCE
        : yAxisRange.max === y2AxisRange.max;

    // If both min and max values are similar, use the lowest min value
    if (minValuesAreSimilar && maxValuesAreSimilar) {
      return Math.min(yAxisRange.min, y2AxisRange.min);
    }
  }, [
    columnLabelFormats,
    shouldUseMinAndMaxValues,
    columnMap,
    checkValues,
    allYValuesArePercentage,
  ]);

  return {
    minTickValue,
  };
};
