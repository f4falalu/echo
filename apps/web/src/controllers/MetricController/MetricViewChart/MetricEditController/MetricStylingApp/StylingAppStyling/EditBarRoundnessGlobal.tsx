import React, { useMemo } from 'react';
import type { BusterMetricChartConfig } from '@/api/asset_interfaces';
import type { ColumnSettings } from '@/api/asset_interfaces/metric/charts';
import { useMemoizedFn } from '@/hooks';
import { EditBarRoundness } from '../StylingAppVisualize/SelectAxis/SelectAxisColumnContent/EditBarRoundness';

export const EditBarRoundnessGlobal: React.FC<{
  columnSettings: BusterMetricChartConfig['columnSettings'];
  onUpdateChartConfig: (chartConfig: Partial<BusterMetricChartConfig>) => void;
}> = React.memo(({ columnSettings, onUpdateChartConfig }) => {
  const mostPermissiveBarRoundness = useMemo(() => {
    return Object.values(columnSettings).reduce((acc, curr) => {
      return Math.min(acc, curr.barRoundness);
    }, Number.POSITIVE_INFINITY);
  }, []);

  const onUpdateBarRoundness = useMemoizedFn((v: Partial<ColumnSettings>) => {
    const newColumnSettings: BusterMetricChartConfig['columnSettings'] = Object.keys(
      columnSettings
    ).reduce<BusterMetricChartConfig['columnSettings']>((acc, curr) => {
      acc[curr] = { ...columnSettings[curr], ...v };
      return acc;
    }, {});

    onUpdateChartConfig({ columnSettings: newColumnSettings });
  });

  return (
    <EditBarRoundness
      barRoundness={mostPermissiveBarRoundness}
      onUpdateColumnSettingConfig={onUpdateBarRoundness}
    />
  );
});
EditBarRoundnessGlobal.displayName = 'EditBarRoundnessGlobal';
