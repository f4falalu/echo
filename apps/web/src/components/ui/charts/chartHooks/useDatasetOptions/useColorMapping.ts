import type { ColorBy } from '@buster/server-shared/metrics';
import { useMemo } from 'react';
import type { BusterChartProps } from '../../BusterChart.types';

/**
 * Hook that creates an efficient color mapping from unique values in a colorBy column to colors.
 * This hook memoizes the color mapping computation to avoid recomputation on re-renders.
 *
 * @param data - The raw chart data
 * @param colorBy - The colorBy configuration specifying which column to use for coloring
 * @param colors - Array of available colors
 * @returns Object with color mapping and a function to get color for a value
 */
export function useColorMapping(
  data: NonNullable<BusterChartProps['data']>,
  colorBy: ColorBy | null,
  colors: string[]
) {
  // Memoize the unique values extraction
  const uniqueColorValues = useMemo(() => {
    if (!colorBy?.columnId || !colors || colors.length === 0) {
      return new Set<string>();
    }

    const values = new Set<string>();
    const columnId = colorBy.columnId;

    for (const row of data) {
      const value = row[columnId];
      if (value !== null && value !== undefined) {
        values.add(String(value));
      }
    }

    return values;
  }, [data, colorBy?.columnId, colors?.length]);

  // Memoize the color mapping creation
  const colorMapping = useMemo(() => {
    if (!colorBy?.columnId || !colors || colors.length === 0 || uniqueColorValues.size === 0) {
      return new Map<string, string>();
    }

    const mapping = new Map<string, string>();
    const valuesArray = Array.from(uniqueColorValues);

    valuesArray.forEach((value, index) => {
      mapping.set(value, colors[index % colors.length]);
    });

    return mapping;
  }, [uniqueColorValues, colors, colorBy?.columnId]);

  // Return the mapping and helper functions
  return useMemo(
    () => ({
      hasColorMapping: colorMapping.size > 0,
      getColorForValue: (value: string | number | null | undefined): string | undefined => {
        if (!colorMapping.size || value === null || value === undefined) {
          return undefined;
        }
        return colorMapping.get(String(value));
      },
    }),
    [colorMapping, colors]
  );
}
