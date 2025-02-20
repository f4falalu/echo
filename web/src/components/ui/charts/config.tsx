import { AppMaterialIcons } from '@/components/ui';
import { ChartType } from './interfaces';

export const chartOptions = [
  {
    label: 'Bar chart',
    value: ChartType.Bar,
    icon: <AppMaterialIcons icon="bar_chart"></AppMaterialIcons>
  },
  {
    label: 'Line chart',
    value: ChartType.Line,
    icon: <AppMaterialIcons icon="stacked_line_chart"></AppMaterialIcons>
  },
  {
    label: 'Pie chart',
    value: ChartType.Pie,
    icon: <AppMaterialIcons icon="pie_chart"></AppMaterialIcons>
  },
  {
    label: 'Scatter chart',
    value: ChartType.Scatter,
    icon: <AppMaterialIcons icon="bubble_chart"></AppMaterialIcons>
  },
  {
    label: 'Metric chart',
    value: ChartType.Metric,
    icon: <AppMaterialIcons icon="looks_one"></AppMaterialIcons>
  }
];
