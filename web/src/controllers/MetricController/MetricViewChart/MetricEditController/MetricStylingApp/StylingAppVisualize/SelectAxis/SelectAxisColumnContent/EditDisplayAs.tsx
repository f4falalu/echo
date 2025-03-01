import { type IBusterMetricChartConfig } from '@/api/asset_interfaces';
import React, { useMemo } from 'react';
import { LabelAndInput } from '../../../Common/LabelAndInput';
import { AppMaterialIcons, AppSegmented, AppTooltip, SegmentedItem } from '@/components/ui';
import { ChartType, type ColumnSettings } from '@/components/ui/charts/interfaces';
import { useMemoizedFn } from 'ahooks';

const options = [
  {
    icon: <AppMaterialIcons icon="bar_chart" data-value="bar" />,
    value: 'bar',
    tooltip: 'Bar'
  },
  {
    icon: <AppMaterialIcons icon="show_chart" data-value="line" />,
    value: 'line',
    tooltip: 'Line'
  },
  // {
  //   icon: <AppMaterialIcons icon="line_chart_area" data-value="area" />,
  //   value: 'area',
  //   tooltip: 'Area'
  // },
  {
    icon: <AppMaterialIcons icon="scatter_plot" data-value="dot" />,
    value: 'dot',
    tooltip: 'Dot'
  }
].map<SegmentedItem<string>>(({ tooltip, icon, ...option }) => ({
  ...option,
  icon: (
    <AppTooltip title={tooltip}>
      <span className="flex items-center justify-center">{icon}</span>
    </AppTooltip>
  )
}));

export const EditDisplayAs: React.FC<{
  columnVisualization: Required<ColumnSettings>['columnVisualization'];
  onUpdateColumnSettingConfig: (columnSettings: Partial<ColumnSettings>) => void;
  selectedChartType: IBusterMetricChartConfig['selectedChartType'];
}> = React.memo(({ columnVisualization, onUpdateColumnSettingConfig, selectedChartType }) => {
  const selectedOption = useMemo(() => {
    if (selectedChartType === ChartType.Bar) return 'bar';
    if (selectedChartType === ChartType.Line) return 'line';
    return options.find((option) => option.value === columnVisualization)?.value || 'bar';
  }, [columnVisualization]);

  const onChange = useMemoizedFn((value: SegmentedItem<string>) => {
    onUpdateColumnSettingConfig({
      columnVisualization: value.value as Required<ColumnSettings>['columnVisualization']
    });
  });

  return (
    <LabelAndInput label="Display as">
      <div className="flex justify-end">
        <AppSegmented options={options} block={false} value={selectedOption} onChange={onChange} />
      </div>
    </LabelAndInput>
  );
});
EditDisplayAs.displayName = 'EditDisplayAs';
