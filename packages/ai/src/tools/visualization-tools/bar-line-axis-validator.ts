import type { MetricYml } from './version-history-types';

export interface AxisValidationResult {
  isValid: boolean;
  shouldSwapAxes: boolean;
  error?: string;
  adjustedYml?: MetricYml;
}

/**
 * Validates and potentially adjusts bar/line chart axes to ensure numeric fields are on Y axis
 * @param metricYml The parsed metric YAML configuration
 * @returns Validation result indicating if axes should be swapped or if there's an error
 */
export function validateAndAdjustBarLineAxes(metricYml: MetricYml): AxisValidationResult {
  // Only validate bar and line charts
  const chartType = metricYml.chartConfig?.selectedChartType;
  if (chartType !== 'bar' && chartType !== 'line') {
    return { isValid: true, shouldSwapAxes: false };
  }

  const barAndLineAxis = metricYml.chartConfig?.barAndLineAxis;
  const columnLabelFormats = metricYml.chartConfig?.columnLabelFormats;

  if (!barAndLineAxis || !columnLabelFormats) {
    return { isValid: true, shouldSwapAxes: false };
  }

  const xColumns = barAndLineAxis.x || [];
  const yColumns = barAndLineAxis.y || [];

  // Check if all Y-axis columns are numeric
  const yAxisNumericStatus = yColumns.map((col: string) => {
    const format = columnLabelFormats[col];
    return format?.columnType === 'number';
  });

  const allYColumnsNumeric = yAxisNumericStatus.every((isNumeric: boolean) => isNumeric);

  // If all Y columns are numeric, no adjustment needed
  if (allYColumnsNumeric) {
    return { isValid: true, shouldSwapAxes: false };
  }

  // At least one Y column is non-numeric, check if we can swap with X
  const xAxisNumericStatus = xColumns.map((col: string) => {
    const format = columnLabelFormats[col];
    return format?.columnType === 'number';
  });

  const allXColumnsNumeric = xAxisNumericStatus.every((isNumeric: boolean) => isNumeric);

  // If X columns are numeric and Y columns are not, swap them
  if (allXColumnsNumeric && !allYColumnsNumeric) {
    // Create adjusted YAML with swapped axes
    const adjustedYml: MetricYml = {
      ...metricYml,
      chartConfig: {
        ...metricYml.chartConfig,
        barAndLineAxis: {
          ...barAndLineAxis,
          x: yColumns, // Swap: Y becomes X
          y: xColumns, // Swap: X becomes Y
        },
      },
    };

    return {
      isValid: true,
      shouldSwapAxes: true,
      adjustedYml,
    };
  }

  // Y has non-numeric columns and X is also non-numeric (or empty)
  // This is an error condition
  const nonNumericYColumns = yColumns.filter(
    (_col: string, index: number) => !yAxisNumericStatus[index]
  );
  const columnTypes = nonNumericYColumns
    .map((col: string) => {
      const format = columnLabelFormats[col];
      return `${col} (${format?.columnType || 'unknown'})`;
    })
    .join(', ');

  return {
    isValid: false,
    shouldSwapAxes: false,
    error: `Bar and line charts require numeric values on the Y axis. The following columns are non-numeric: ${columnTypes}. Please adjust your SQL query to ensure numeric columns are used for the Y axis, or use a different chart type.`,
  };
}
