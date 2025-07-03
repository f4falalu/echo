import { z } from 'zod/v4';
import { GoalLineSchema, TrendlineSchema } from './annotationInterfaces';
import { BarChartPropsSchema } from './barChartProps';
import { ColumnSettingsSchema } from './columnInterfaces';
import { IColumnLabelFormatSchema } from './columnLabelInterfaces';
import { ComboChartPropsSchema } from './comboChartProps';
import { DEFAULT_CHART_THEME } from './configColors';
import { ChartTypeSchema } from './enum';
import { ShowLegendHeadlineSchema } from './etcInterfaces';
import { LineChartPropsSchema } from './lineChartProps';
import { DerivedMetricTitleSchema, MetricChartPropsSchema } from './metricChartProps';
import { PieChartPropsSchema } from './pieChartProps';
import { ScatterChartPropsSchema } from './scatterChartProps';
import { TableChartPropsSchema } from './tableChartProps';
import {
  CategoryAxisStyleConfigSchema,
  XAxisConfigSchema,
  Y2AxisConfigSchema,
  YAxisConfigSchema,
} from './tickInterfaces';

export const ChartConfigPropsSchema = z.object({
  selectedChartType: ChartTypeSchema,
  // COLUMN SETTINGS
  // OPTIONAL because the defaults will be determined by the UI
  columnSettings: z.record(z.string(), z.optional(ColumnSettingsSchema)).default({}),
  columnLabelFormats: z.record(z.string(), z.optional(IColumnLabelFormatSchema)).default({}),
  // OPTIONAL: default is the buster color palette
  colors: z.array(z.string()).default(DEFAULT_CHART_THEME),
  // OPTIONAL: default is null and will be true if there are multiple Y axes or if a category axis is used
  showLegend: z.nullable(z.boolean()).default(null),
  // OPTIONAL: default: true
  gridLines: z.boolean().default(true),
  // OPTIONAL
  showLegendHeadline: ShowLegendHeadlineSchema,
  // OPTIONAL: default is no goal lines
  goalLines: z.array(GoalLineSchema).default([]),
  // OPTIONAL: default is no trendlines
  trendlines: z.array(TrendlineSchema).default([]),
  // OPTIONAL: default is false
  disableTooltip: z.boolean().default(false),
  // Spread the shape properties from all schemas
  ...YAxisConfigSchema.shape,
  ...XAxisConfigSchema.shape,
  ...CategoryAxisStyleConfigSchema.shape,
  ...Y2AxisConfigSchema.shape,
  ...BarChartPropsSchema.shape,
  ...LineChartPropsSchema.shape,
  ...ScatterChartPropsSchema.shape,
  ...PieChartPropsSchema.shape,
  ...TableChartPropsSchema.shape,
  ...ComboChartPropsSchema.shape,
  ...MetricChartPropsSchema.shape,
});

// Re-export schemas for backward compatibility
export {
  BarChartPropsSchema,
  LineChartPropsSchema,
  ScatterChartPropsSchema,
  PieChartPropsSchema,
  TableChartPropsSchema,
  ComboChartPropsSchema,
  MetricChartPropsSchema,
  DerivedMetricTitleSchema,
};

// Export original types for backward compatibility
export type ChartConfigProps = z.infer<typeof ChartConfigPropsSchema>;
export type DerivedMetricTitle = z.infer<typeof DerivedMetricTitleSchema>;
export type MetricChartProps = z.infer<typeof MetricChartPropsSchema>;
export type BarChartProps = z.infer<typeof BarChartPropsSchema>;
export type LineChartProps = z.infer<typeof LineChartPropsSchema>;
export type ScatterChartProps = z.infer<typeof ScatterChartPropsSchema>;
export type PieChartProps = z.infer<typeof PieChartPropsSchema>;
export type TableChartProps = z.infer<typeof TableChartPropsSchema>;
export type ComboChartProps = z.infer<typeof ComboChartPropsSchema>;
