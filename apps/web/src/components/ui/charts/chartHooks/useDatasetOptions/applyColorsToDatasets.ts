import type { BusterChartProps } from '../../BusterChart.types';
import type { DatasetOptionsWithTicks } from './interfaces';

/**
 * Efficiently applies colors to datasets based on original data and a pre-computed color mapping.
 * This function maps dataset data points back to the original data to find colorBy values.
 *
 * @param datasets - The datasets to apply colors to
 * @param colorMapping - Pre-computed color mapping from useColorMapping
 * @param colorByField - The field name used for color mapping
 * @param originalData - The original data to map colors from
 * @returns Modified datasets with colors applied
 */
export function applyColorsToDatasets(
  datasets: DatasetOptionsWithTicks,
  getColorForValue: (value: string | number | null | undefined) => string | undefined,
  colorByField: string,
  originalData: NonNullable<BusterChartProps['data']>
): DatasetOptionsWithTicks {
  // Create a color array based on the original data order
  const dataPointColors: string[] = originalData
    .map((row) => {
      const colorValue = row[colorByField];
      if (colorValue !== null && colorValue !== undefined) {
        const color = getColorForValue(String(colorValue));
        return color || ''; // Return empty string if no color found
      }
      return '';
    })
    .filter((color) => color !== ''); // Remove empty colors

  // Apply colors to each dataset
  const datasetsWithColors = datasets.datasets.map((dataset) => {
    // For simple cases, each dataset corresponds to the original data points
    // The dataset.data array should have the same length as the original data
    const datasetColors = dataPointColors.slice(0, dataset.data.length);

    return {
      ...dataset,
      colors: datasetColors,
    };
  });

  console.log('datasetsWithColors', datasetsWithColors);

  return {
    ...datasets,
    datasets: datasetsWithColors,
  };
}
