import type { ChartConfigProps } from '@buster/server-shared/metrics';

/**
 * Validates and potentially adjusts bar/line chart axes to ensure numeric fields are on Y axis
 * @param metricYml The parsed metric YAML configuration
 * @returns Validation result indicating if axes should be swapped or if there's an error
 */
export function validateAndAdjustBarLineAxes(
  metricChartConfig: ChartConfigProps
): ChartConfigProps {
  // Only validate bar and line charts
  const chartType = metricChartConfig.selectedChartType;
  if (chartType !== 'bar' && chartType !== 'line') {
    return metricChartConfig;
  }

  const barAndLineAxis = metricChartConfig.barAndLineAxis;
  const columnLabelFormats = metricChartConfig.columnLabelFormats;

  if (!barAndLineAxis || !columnLabelFormats) {
    return metricChartConfig;
  }

  if (!barAndLineAxis.x?.length || !barAndLineAxis.y?.length) {
    throw new Error(
      'Bar and line charts require at least one column for each axis. Please specify both X and Y axis columns.'
    );
  }
  const xColumns = barAndLineAxis.x;
  const yColumns = barAndLineAxis.y;

  // Check if all Y-axis columns are numeric
  const yAxisNumericStatus = yColumns.map((col: string) => {
    const format = columnLabelFormats[col];
    return format?.columnType === 'number';
  });

  const allYColumnsNumeric = yAxisNumericStatus.every((isNumeric: boolean) => isNumeric);

  // If all Y columns are numeric, check if we need to auto-set percentage-stack
  if (allYColumnsNumeric) {
    return autoSetPercentageStack(metricChartConfig, yColumns, columnLabelFormats);
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
    const swappedAxisChartConfig: ChartConfigProps = {
      ...metricChartConfig,
      barAndLineAxis: {
        ...barAndLineAxis,
        x: yColumns, // Swap: Y becomes X
        y: xColumns, // Swap: X becomes Y
      },
    };

    return swappedAxisChartConfig;
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

  throw new Error(
    `Bar and line charts require numeric values on the Y axis. The following columns are non-numeric: ${columnTypes}. Please adjust your SQL query to ensure numeric columns are used for the Y axis, or use a different chart type.`
  );
}

/**
 * Automatically sets barGroupType to 'percentage-stack' if Y-axis columns are percentage-styled
 * @param chartConfig The chart configuration
 * @param yColumns The Y-axis column names
 * @param columnLabelFormats The column format configurations
 * @returns Updated chart configuration with auto-adjusted barGroupType if needed
 */
function autoSetPercentageStack(
  chartConfig: ChartConfigProps,
  yColumns: string[],
  columnLabelFormats: ChartConfigProps['columnLabelFormats']
): ChartConfigProps {
  // Only apply to bar charts (line charts use lineGroupType)
  if (chartConfig.selectedChartType !== 'bar') {
    return chartConfig;
  }

  // Check if any Y-axis column has percent style
  const hasPercentStyle = yColumns.some((col: string) => {
    const format = columnLabelFormats?.[col];
    return format?.style === 'percent';
  });

  // If we have percent-styled columns and barGroupType is 'stack', auto-change to 'percentage-stack'
  if (hasPercentStyle && chartConfig.barGroupType === 'stack') {
    return {
      ...chartConfig,
      barGroupType: 'percentage-stack',
    };
  }

  return chartConfig;
}
