import type { ColumnMetaData } from '../metadata.type';
import { type Metric, MetricSchema } from '../metric.types';
import { type Trendline, TrendlineSchema } from './annotationInterfaces';
import { type ChartConfigProps, ChartConfigPropsSchema } from './chartConfigProps';
import { type ColumnSettings, ColumnSettingsSchema } from './columnInterfaces';
import { type ColumnLabelFormat, ColumnLabelFormatSchema } from './columnLabelInterfaces';
import { getDefaults } from './defaultHelpers';

export const DEFAULT_CHART_CONFIG: ChartConfigProps = getDefaults(ChartConfigPropsSchema);
export const DEFAULT_COLUMN_SETTINGS: ColumnSettings = getDefaults(ColumnSettingsSchema);
export const DEFAULT_COLUMN_LABEL_FORMAT: ColumnLabelFormat = getDefaults(ColumnLabelFormatSchema);

export const ENABLED_DOTS_ON_LINE = 3.5;
export const DEFAULT_CHART_CONFIG_ENTRIES = Object.entries(DEFAULT_CHART_CONFIG);
export const DEFAULT_BAR_ROUNDNESS = DEFAULT_COLUMN_SETTINGS.barRoundness;
export const MIN_DONUT_WIDTH = 15;

export const DEFAULT_DAY_OF_WEEK_FORMAT = 'ddd';
export const DEFAULT_DATE_FORMAT_DAY_OF_WEEK = 'dddd';
export const DEFAULT_DATE_FORMAT_MONTH_OF_YEAR = 'MMMM';
export const DEFAULT_DATE_FORMAT_QUARTER = 'YYYY [Q]Q';

export const ENABLED_DOTS_ON_LINE_SIZE = 4;
export const DEFAULT_COLUMN_METADATA: ColumnMetaData[] = [];

export const DEFAULT_TRENDLINE_CONFIG: Required<Trendline> = getDefaults(TrendlineSchema);
export const DEFAULT_METRIC: Required<Metric> = getDefaults(MetricSchema);
